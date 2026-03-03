import {
  ComponentPropsWithoutRef,
  RefObject,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { useAudioContext } from '@/app/hooks/use-audio-context'
import {
  usePlayerActions,
  usePlayerIsPlaying,
  usePlayerMediaType,
  usePlayerVolume,
  useReplayGainActions,
  useReplayGainState,
} from '@/store/player.store'
import { logger } from '@/utils/logger'
import { calculateReplayGain, ReplayGainParams } from '@/utils/replayGain'

type AudioPlayerProps = ComponentPropsWithoutRef<'audio'> & {
  audioRef: RefObject<HTMLAudioElement>
  replayGain?: ReplayGainParams
  shouldPlay?: boolean
  ignoreErrors?: boolean
}

export function AudioPlayer({
  audioRef,
  replayGain,
  shouldPlay = true,
  ignoreErrors = false,
  src,
  ...props
}: AudioPlayerProps) {
  const isDev = import.meta.env.DEV
  const { t } = useTranslation()
  const [previousGain, setPreviousGain] = useState(1)
  const { replayGainEnabled, replayGainError } = useReplayGainState()
  const { isSong, isRadio, isPodcast } = usePlayerMediaType()
  const { setPlayingState } = usePlayerActions()
  const { setReplayGainEnabled, setReplayGainError } = useReplayGainActions()
  const { volume } = usePlayerVolume()
  const isPlaying = usePlayerIsPlaying()
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  )

  const gainValue = useMemo(() => {
    const audioVolume = volume / 100

    if (!replayGain || !replayGainEnabled) {
      return audioVolume * 1
    }
    const gain = calculateReplayGain(replayGain)

    return audioVolume * gain
  }, [replayGain, replayGainEnabled, volume])

  const { resumeContext, setupGain } = useAudioContext(audioElement)
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedByFadeRef = useRef(false)
  const playbackRequestedAtRef = useRef<number | null>(null)
  const handleAudioRef = useCallback(
    (node: HTMLAudioElement | null) => {
      audioRef.current = node
      setAudioElement(node)
    },
    [audioRef],
  )

  const ignoreGain = !isSong || replayGainError

  const getMediaType = useCallback(
    () =>
      isSong ? 'song' : isRadio ? 'radio' : isPodcast ? 'podcast' : 'unknown',
    [isPodcast, isRadio, isSong],
  )

  const streamStartAtRef = useRef<number | null>(null)
  const loadStartAtRef = useRef<number | null>(null)
  const loadedMetadataAtRef = useRef<number | null>(null)
  const canPlayAtRef = useRef<number | null>(null)
  const lastStreamSrcRef = useRef<string | null>(null)

  const resetStreamDebugRefs = useCallback(() => {
    streamStartAtRef.current = null
    loadStartAtRef.current = null
    loadedMetadataAtRef.current = null
    canPlayAtRef.current = null
    playbackRequestedAtRef.current = null
  }, [])

  const logStreamPhase = useCallback(
    (phase: string, extra?: Record<string, unknown>) => {
      if (!isDev) return
      const now = performance.now()
      const streamStartAt = streamStartAtRef.current
      const loadStartAt = loadStartAtRef.current
      const metadataAt = loadedMetadataAtRef.current
      const canPlayAt = canPlayAtRef.current
      const audio = audioRef.current

      logger.info('[PlaybackDebug] Stream phase', {
        phase,
        mediaType: getMediaType(),
        src: audio?.currentSrc || audio?.src || src,
        sinceStreamStartMs:
          streamStartAt === null ? null : Math.round(now - streamStartAt),
        sinceLoadStartMs:
          loadStartAt === null ? null : Math.round(now - loadStartAt),
        loadStartToMetadataMs:
          loadStartAt === null || metadataAt === null
            ? null
            : Math.round(metadataAt - loadStartAt),
        metadataToCanPlayMs:
          metadataAt === null || canPlayAt === null
            ? null
            : Math.round(canPlayAt - metadataAt),
        readyState: audio?.readyState,
        networkState: audio?.networkState,
        ...extra,
      })
    },
    [audioRef, getMediaType, src],
  )

  const logPlaybackLatency = useCallback(
    (event: 'play' | 'playing') => {
      if (!isDev) return
      const requestedAt = playbackRequestedAtRef.current
      const audio = audioRef.current
      if (requestedAt === null || !audio) return

      const latencyMs = Math.round(performance.now() - requestedAt)
      logger.info('[PlaybackDebug] Running -> actual playback', {
        event,
        latencyMs,
        readyState: audio.readyState,
        networkState: audio.networkState,
        src: audio.currentSrc || audio.src,
        mediaType: getMediaType(),
        loadStartToPlayingMs:
          loadStartAtRef.current === null
            ? null
            : Math.round(performance.now() - loadStartAtRef.current),
      })

      playbackRequestedAtRef.current = null
    },
    [audioRef, getMediaType],
  )

  const clearPauseFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }
  }, [])

  const pauseWithFade = useCallback(
    (audio: HTMLAudioElement) => {
      clearPauseFade()

      const fadeDurationMs = 500
      const fadeSteps = 20
      const tickMs = Math.max(12, Math.floor(fadeDurationMs / fadeSteps))
      const startVolume = Math.max(audio.volume, Math.min(1, volume / 100))
      let step = 0

      pausedByFadeRef.current = true

      fadeIntervalRef.current = setInterval(() => {
        step += 1
        const progress = Math.min(1, step / fadeSteps)
        audio.volume = Math.max(0, startVolume * (1 - progress))
      }, tickMs)

      fadeTimeoutRef.current = setTimeout(() => {
        clearPauseFade()
        audio.pause()
        audio.volume = 0
      }, fadeDurationMs + tickMs)
    },
    [clearPauseFade, volume],
  )

  useEffect(() => {
    if (ignoreGain || !audioRef.current) return

    if (gainValue === previousGain) return

    setupGain(gainValue, replayGain)
    setPreviousGain(gainValue)
  }, [audioRef, ignoreGain, gainValue, previousGain, replayGain, setupGain])

  const handleSongError = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    logger.error('Audio load error', {
      src: audio.src,
      networkState: audio.networkState,
      readyState: audio.readyState,
      error: audio.error,
    })

    toast.error(t('warnings.songError'))

    if (replayGainEnabled || !replayGainError) {
      setReplayGainEnabled(false)
      setReplayGainError(true)
      window.location.reload()
    }
  }, [
    audioRef,
    replayGainEnabled,
    replayGainError,
    setReplayGainEnabled,
    setReplayGainError,
    t,
  ])

  const isBenignPlaybackError = useCallback((error: unknown) => {
    if (!(error instanceof Error)) return false
    const message = error.message.toLowerCase()
    return (
      error.name === 'AbortError' ||
      message.includes('interrupted') ||
      message.includes('aborted') ||
      message.includes('play() request was interrupted')
    )
  }, [])

  const handleRadioError = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    toast.error(t('radios.error'))
    setPlayingState(false)
  }, [audioRef, setPlayingState, t])

  useEffect(() => {
    async function handleSong() {
      const audio = audioRef.current
      if (!audio) return

      try {
        if (isPlaying && shouldPlay) {
          if (streamStartAtRef.current === null) {
            streamStartAtRef.current = performance.now()
            logStreamPhase('run-requested')
          }
          if (playbackRequestedAtRef.current === null) {
            playbackRequestedAtRef.current = performance.now()
          }
          clearPauseFade()
          if (pausedByFadeRef.current) {
            audio.volume = Math.min(1, volume / 100)
            pausedByFadeRef.current = false
          }
          if (isSong) await resumeContext()
          await audio.play()
        } else {
          resetStreamDebugRefs()
          if ((isSong || isPodcast) && !audio.paused) {
            pauseWithFade(audio)
          } else {
            audio.pause()
          }
        }
      } catch (error) {
        if (isBenignPlaybackError(error)) {
          logger.info('Ignoring benign playback interruption', {
            name: error instanceof Error ? error.name : undefined,
            message: error instanceof Error ? error.message : undefined,
          })
          return
        }
        logger.error('Audio playback failed', error)
        resetStreamDebugRefs()
        handleSongError()
      }
    }
    if (isSong || isPodcast) handleSong()
  }, [
    audioRef,
    clearPauseFade,
    handleSongError,
    isBenignPlaybackError,
    isPlaying,
    isSong,
    isPodcast,
    pauseWithFade,
    resumeContext,
    shouldPlay,
    volume,
    logStreamPhase,
    resetStreamDebugRefs,
  ])

  useEffect(() => {
    async function handleRadio() {
      const audio = audioRef.current
      if (!audio) return

      if (isPlaying) {
        audio.load()
        await audio.play()
      } else {
        audio.pause()
      }
    }
    if (isRadio) handleRadio()
  }, [audioRef, isPlaying, isRadio])

  useEffect(() => {
    return () => {
      clearPauseFade()
    }
  }, [clearPauseFade])

  const handleError = useMemo(() => {
    if (ignoreErrors) return undefined
    if (isSong) return handleSongError
    if (isRadio) return handleRadioError

    return undefined
  }, [handleRadioError, handleSongError, ignoreErrors, isRadio, isSong])

  useEffect(() => {
    resetStreamDebugRefs()
  }, [resetStreamDebugRefs])

  const {
    onPlay: onPlayProp,
    onPlaying: onPlayingProp,
    onLoadStart: onLoadStartProp,
    onLoadedMetadata: onLoadedMetadataProp,
    onCanPlay: onCanPlayProp,
    ...audioProps
  } = props

  const handleLoadStart = useCallback(
    (event: SyntheticEvent<HTMLAudioElement, Event>) => {
      const currentSrc =
        event.currentTarget.currentSrc || event.currentTarget.src || src || null
      if (currentSrc !== lastStreamSrcRef.current) {
        resetStreamDebugRefs()
        lastStreamSrcRef.current = currentSrc
      }
      if (loadStartAtRef.current === null) {
        loadStartAtRef.current = performance.now()
      }
      if (streamStartAtRef.current === null) {
        streamStartAtRef.current = loadStartAtRef.current
      }
      logStreamPhase('loadstart')
      onLoadStartProp?.(event)
    },
    [logStreamPhase, onLoadStartProp, resetStreamDebugRefs, src],
  )

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLAudioElement, Event>) => {
      if (loadedMetadataAtRef.current === null) {
        loadedMetadataAtRef.current = performance.now()
      }
      logStreamPhase('loadedmetadata')
      onLoadedMetadataProp?.(event)
    },
    [logStreamPhase, onLoadedMetadataProp],
  )

  const handleCanPlay = useCallback(
    (event: SyntheticEvent<HTMLAudioElement, Event>) => {
      if (canPlayAtRef.current === null) {
        canPlayAtRef.current = performance.now()
      }
      logStreamPhase('canplay')
      onCanPlayProp?.(event)
    },
    [logStreamPhase, onCanPlayProp],
  )

  const handlePlay = useCallback(
    (event: SyntheticEvent<HTMLAudioElement, Event>) => {
      onPlayProp?.(event)
    },
    [onPlayProp],
  )

  const handlePlaying = useCallback(
    (event: SyntheticEvent<HTMLAudioElement, Event>) => {
      logPlaybackLatency('playing')
      onPlayingProp?.(event)
    },
    [logPlaybackLatency, onPlayingProp],
  )

  return (
    <audio
      ref={handleAudioRef}
      {...audioProps}
      src={src}
      crossOrigin="anonymous"
      onError={handleError}
      onLoadStart={handleLoadStart}
      onLoadedMetadata={handleLoadedMetadata}
      onCanPlay={handleCanPlay}
      onPlay={handlePlay}
      onPlaying={handlePlaying}
    />
  )
}
