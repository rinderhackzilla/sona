import {
  ComponentPropsWithoutRef,
  RefObject,
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
  const { t } = useTranslation()
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
  const handleAudioRef = useCallback(
    (node: HTMLAudioElement | null) => {
      audioRef.current = node
      setAudioElement(node)
    },
    [audioRef],
  )

  const ignoreGain = !isSong || replayGainError

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
    // Always apply gain on mount/deck switch and whenever gain inputs change.
    // Relying on previous-value short-circuiting can leave a freshly created
    // deck gain node at default 1.0 and cause loudness jumps after crossfade.
    if (ignoreGain || !audioRef.current) return
    setupGain(gainValue, replayGain)
  }, [audioRef, ignoreGain, gainValue, replayGain, setupGain])

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
          clearPauseFade()
          if (pausedByFadeRef.current) {
            audio.volume = Math.min(1, volume / 100)
            pausedByFadeRef.current = false
          }
          if (isSong) await resumeContext()
          await audio.play()
        } else {
          // Deck handover path (global playback is running, this deck became inactive):
          // pause immediately and avoid pause-fade state, otherwise next activation can
          // restore volume abruptly and create loudness jumps during crossfade.
          if (isPlaying && !shouldPlay) {
            clearPauseFade()
            pausedByFadeRef.current = false
            audio.pause()
            audio.volume = 0
            return
          }

          // User pause path: keep short fade-out for active media.
          if ((isSong || isPodcast) && !audio.paused) {
            pauseWithFade(audio)
          } else {
            audio.pause()
          }
        }
      } catch (error) {
        if (isBenignPlaybackError(error)) {
          return
        }
        logger.error('Audio playback failed', error)
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

  return (
    <audio
      ref={handleAudioRef}
      {...props}
      src={src}
      crossOrigin="anonymous"
      onError={handleError}
    />
  )
}
