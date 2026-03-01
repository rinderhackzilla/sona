import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  getCoverArtUrl,
  getSongStreamUrl,
} from '@/api/httpClient'
import { getProxyURL } from '@/api/podcastClient'
import { SonaDjButton } from '@/app/components/fullscreen/sona-dj'
import { RadioInfo } from '@/app/components/player/radio-info'
import { TrackInfo } from '@/app/components/player/track-info'
import { podcasts } from '@/service/podcasts'
import {
  getVolume,
  useCrossfadeSettings,
  usePlayerActions,
  usePlayerIsPlaying,
  usePlayerLoop,
  usePlayerMediaType,
  usePlayerPrevAndNext,
  usePlayerSonglist,
  usePlayerStore,
  useReplayGainState,
} from '@/store/player.store'
import { LoopState } from '@/types/playerContext'
import { logger } from '@/utils/logger'
import { ReplayGainParams } from '@/utils/replayGain'
import { useRenderCounter } from '@/app/hooks/use-render-counter'
import { AudioPlayer } from './audio'
import { PlayerClearQueueButton } from './clear-queue-button'
import { PlayerControls } from './controls'
import { PlayerLikeButton } from './like-button'
import { PlayerLyricsButton } from './lyrics-button'
import { PodcastInfo } from './podcast-info'
import { PodcastPlaybackRate } from './podcast-playback-rate'
import { PlayerProgress } from './progress'
import { PlayerQueueButton } from './queue-button'
import { PlayerVolume } from './volume'

const MemoTrackInfo = memo(TrackInfo)
const MemoRadioInfo = memo(RadioInfo)
const MemoPodcastInfo = memo(PodcastInfo)
const MemoPlayerControls = memo(PlayerControls)
const MemoPlayerProgress = memo(PlayerProgress)
const MemoPlayerLikeButton = memo(PlayerLikeButton)
const MemoPlayerQueueButton = memo(PlayerQueueButton)
const MemoPlayerClearQueueButton = memo(PlayerClearQueueButton)
const MemoPlayerVolume = memo(PlayerVolume)
const MemoPodcastPlaybackRate = memo(PodcastPlaybackRate)
const MemoLyricsButton = memo(PlayerLyricsButton)
const MemoAudioPlayer = memo(AudioPlayer)

type DeckId = 'a' | 'b'
type CrossfadeState = 'idle' | 'arming' | 'fading' | 'committing' | 'failed'

export function Player({ hideUi = false }: { hideUi?: boolean }) {
  useRenderCounter('Player')
  const songDeckARef = useRef<HTMLAudioElement>(null)
  const songDeckBRef = useRef<HTMLAudioElement>(null)
  const radioRef = useRef<HTMLAudioElement>(null)
  const podcastRef = useRef<HTMLAudioElement>(null)
  const crossfadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const crossfadeRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeOutStartedRef = useRef(false)
  const isCrossfadingRef = useRef(false)
  const crossfadeCommitRef = useRef(false)
  const incomingDeckRef = useRef<DeckId | null>(null)
  const crossfadeStateRef = useRef<CrossfadeState>('idle')
  const crossfadeRetryRef = useRef(0)
  const [activeDeck, setActiveDeck] = useState<DeckId>('a')
  const [incomingDeck, setIncomingDeck] = useState<DeckId | null>(null)
  const [deckAIndex, setDeckAIndex] = useState<number | null>(null)
  const [deckBIndex, setDeckBIndex] = useState<number | null>(null)

  const {
    setAudioPlayerRef,
    setCurrentDuration,
    setProgress,
    setPlayingState,
    handleSongEnded,
    getCurrentProgress,
    getCurrentPodcastProgress,
    playNextSong,
  } = usePlayerActions()
  const { currentList, currentSongIndex, radioList, podcastList } =
    usePlayerSonglist()
  const isPlaying = usePlayerIsPlaying()
  const { isSong, isRadio, isPodcast } = usePlayerMediaType()
  const loopState = usePlayerLoop()
  const { hasNext } = usePlayerPrevAndNext()
  const currentPlaybackRate = usePlayerStore().playerState.currentPlaybackRate
  const { replayGainType, replayGainPreAmp, replayGainDefaultGain } =
    useReplayGainState()
  const { enabled: crossfadeEnabled } = useCrossfadeSettings()

  const CROSSFADE_DURATION_S = 3
  const MAX_CROSSFADE_RETRIES = 2
  const CROSSFADE_RETRY_DELAY_MS = 150

  const song = currentList[currentSongIndex]
  const radio = radioList[currentSongIndex]
  const podcast = podcastList[currentSongIndex]
  const deckASong = deckAIndex !== null ? currentList[deckAIndex] : undefined
  const deckBSong = deckBIndex !== null ? currentList[deckBIndex] : undefined

  const getDeckRef = useCallback(
    (deck: DeckId) => (deck === 'a' ? songDeckARef : songDeckBRef),
    [],
  )

  const getActiveSongDeckRef = useCallback(
    () => (activeDeck === 'a' ? songDeckARef : songDeckBRef),
    [activeDeck],
  )

  const clearFade = useCallback(() => {
    if (crossfadeIntervalRef.current !== null) {
      clearInterval(crossfadeIntervalRef.current)
      crossfadeIntervalRef.current = null
    }
    if (crossfadeRetryTimeoutRef.current !== null) {
      clearTimeout(crossfadeRetryTimeoutRef.current)
      crossfadeRetryTimeoutRef.current = null
    }
  }, [])

  const getAudioRef = useCallback(() => {
    if (isRadio) return radioRef
    if (isPodcast) return podcastRef
    return getActiveSongDeckRef()
  }, [getActiveSongDeckRef, isPodcast, isRadio])

  const getNextSongIndex = useCallback(() => {
    if (hasNext) return currentSongIndex + 1
    if (loopState === LoopState.All && currentList.length > 0) return 0
    return null
  }, [currentList.length, currentSongIndex, hasNext, loopState])

  // Keep deck assignment synced when user changes track manually.
  useEffect(() => {
    if (!isSong) {
      setDeckAIndex(null)
      setDeckBIndex(null)
      isCrossfadingRef.current = false
      incomingDeckRef.current = null
      setIncomingDeck(null)
      fadeOutStartedRef.current = false
      crossfadeStateRef.current = 'idle'
      crossfadeRetryRef.current = 0
      clearFade()
      return
    }

    if (crossfadeCommitRef.current) {
      crossfadeCommitRef.current = false
      return
    }

    setDeckAIndex((prev) => (activeDeck === 'a' ? currentSongIndex : prev))
    setDeckBIndex((prev) => (activeDeck === 'b' ? currentSongIndex : prev))

    if (activeDeck === 'a') setDeckBIndex(null)
    if (activeDeck === 'b') setDeckAIndex(null)

    isCrossfadingRef.current = false
    incomingDeckRef.current = null
    setIncomingDeck(null)
    fadeOutStartedRef.current = false
    crossfadeStateRef.current = 'idle'
    crossfadeRetryRef.current = 0
    clearFade()
  }, [activeDeck, clearFade, currentSongIndex, isSong])

  // Keep active song deck as the source for progress/volume/visualizer.
  useEffect(() => {
    if (!isSong) return
    const activeRef = getActiveSongDeckRef().current
    if (activeRef) {
      setAudioPlayerRef(activeRef)
    }
  }, [getActiveSongDeckRef, isSong, setAudioPlayerRef])

  useEffect(() => {
    const audio = podcastRef.current
    if (!audio || !isPodcast) return
    audio.playbackRate = currentPlaybackRate
  }, [currentPlaybackRate, isPodcast])

  useEffect(() => {
    if (crossfadeEnabled || !isSong) return
    clearFade()
    incomingDeckRef.current = null
    setIncomingDeck(null)
    isCrossfadingRef.current = false
    fadeOutStartedRef.current = false
    crossfadeStateRef.current = 'idle'
    crossfadeRetryRef.current = 0
    if (activeDeck === 'a') setDeckBIndex(null)
    if (activeDeck === 'b') setDeckAIndex(null)
  }, [activeDeck, clearFade, crossfadeEnabled, isSong])

  useEffect(() => {
    if (!isSong || !isCrossfadingRef.current || !incomingDeckRef.current) return
    if (crossfadeIntervalRef.current !== null) return

    const outgoingDeck = activeDeck
    const incomingDeck = incomingDeckRef.current
    const outgoingAudio = getDeckRef(outgoingDeck).current
    const incomingAudio = getDeckRef(incomingDeck).current

    if (!outgoingAudio || !incomingAudio) return

    const targetVolume = getVolume() / 100
    const durationMs = CROSSFADE_DURATION_S * 1000
    const steps = Math.max(20, Math.floor(durationMs / 30))
    const stepMs = Math.max(16, Math.floor(durationMs / steps))
    let step = 0
    crossfadeStateRef.current = 'fading'

    incomingAudio.volume = 0
    let aborted = false
    const finalizeFallback = () => {
      if (aborted) return
      clearFade()
      incomingDeckRef.current = null
      setIncomingDeck(null)
      isCrossfadingRef.current = false
      fadeOutStartedRef.current = false
      crossfadeStateRef.current = 'failed'
      crossfadeRetryRef.current = 0
      playNextSong()
    }

    const attemptPlayIncoming = () => {
      incomingAudio.play().catch(() => {
        if (aborted) return
        if (crossfadeRetryRef.current < MAX_CROSSFADE_RETRIES) {
          crossfadeRetryRef.current += 1
          crossfadeRetryTimeoutRef.current = setTimeout(
            attemptPlayIncoming,
            CROSSFADE_RETRY_DELAY_MS * (crossfadeRetryRef.current + 1),
          )
          return
        }
        finalizeFallback()
      })
    }
    if (isPlaying) attemptPlayIncoming()

    crossfadeIntervalRef.current = setInterval(() => {
      if (aborted) return
      step += 1
      const progress = Math.min(1, step / steps)

      outgoingAudio.volume = Math.max(0, targetVolume * (1 - progress))
      incomingAudio.volume = Math.min(targetVolume, targetVolume * progress)

      if (progress >= 1) {
        clearFade()
        crossfadeStateRef.current = 'committing'

        outgoingAudio.pause()
        outgoingAudio.currentTime = 0
        outgoingAudio.volume = targetVolume

        crossfadeCommitRef.current = true
        setActiveDeck(incomingDeck)
        if (incomingDeck === 'a') setDeckBIndex(null)
        if (incomingDeck === 'b') setDeckAIndex(null)

        incomingDeckRef.current = null
        setIncomingDeck(null)
        isCrossfadingRef.current = false
        fadeOutStartedRef.current = false
        crossfadeStateRef.current = 'idle'
        crossfadeRetryRef.current = 0

        playNextSong()
        setAudioPlayerRef(incomingAudio)
        if (Number.isFinite(incomingAudio.duration)) {
          setCurrentDuration(Math.floor(incomingAudio.duration))
        }
        setProgress(Math.floor(incomingAudio.currentTime))
      }
    }, stepMs)

    return () => {
      aborted = true
    }
  }, [
    activeDeck,
    clearFade,
    getDeckRef,
    isPlaying,
    isSong,
    playNextSong,
    setAudioPlayerRef,
    setCurrentDuration,
    setProgress,
  ])

  // Get album cover URL for background
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)

  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (isSong && song?.coverArt) {
        try {
          const imageUrl = await getCoverArtUrl(song.coverArt, 'song', '400')
          setBackgroundImage(imageUrl)
        } catch (error) {
          console.error('Error loading background image:', error)
          setBackgroundImage(null)
        }
      } else {
        setBackgroundImage(null)
      }
    }

    loadBackgroundImage()
  }, [isSong, song?.coverArt])

  const setupDuration = useCallback(
    (deck?: DeckId) => {
      const audio =
        isSong && deck ? getDeckRef(deck).current : getAudioRef().current
      if (!audio) return

      const audioDuration = Math.floor(audio.duration)
      const infinityDuration = audioDuration === Infinity

      if (!infinityDuration) {
        if (!isSong || !deck || deck === activeDeck) {
          setCurrentDuration(audioDuration)
        }
      }

      if (isPodcast && infinityDuration && podcast) {
        setCurrentDuration(podcast.duration)
      }

      if (isPodcast) {
        const podcastProgress = getCurrentPodcastProgress()

        logger.info('[Player] - Resuming episode from:', {
          seconds: podcastProgress,
        })

        setProgress(podcastProgress)
        audio.currentTime = podcastProgress
      } else {
        if (isSong && deck && deck !== activeDeck) {
          audio.currentTime = 0
        } else {
          const progress = getCurrentProgress()
          audio.currentTime = progress
        }
      }
    },
    [
      getAudioRef,
      getCurrentPodcastProgress,
      getCurrentProgress,
      getDeckRef,
      isPodcast,
      isSong,
      podcast,
      activeDeck,
      setCurrentDuration,
      setProgress,
    ],
  )

  const setupProgress = useCallback(
    (deck?: DeckId) => {
      const audio =
        isSong && deck ? getDeckRef(deck).current : getAudioRef().current
      if (!audio) return

      if (isSong && deck && deck !== activeDeck) return

      const currentProgress = Math.floor(audio.currentTime)
      setProgress(currentProgress)

      if (!crossfadeEnabled || !isSong) return
      if (isCrossfadingRef.current || fadeOutStartedRef.current) return
      if (!Number.isFinite(audio.duration) || audio.duration <= CROSSFADE_DURATION_S * 2) {
        return
      }

      const nextSongIndex = getNextSongIndex()
      if (nextSongIndex === null) return
      if (!currentList[nextSongIndex]) return

      const timeLeft = audio.duration - audio.currentTime
      if (timeLeft > 0 && timeLeft <= CROSSFADE_DURATION_S) {
        const incomingDeck: DeckId = activeDeck === 'a' ? 'b' : 'a'

        crossfadeStateRef.current = 'arming'
        fadeOutStartedRef.current = true
        isCrossfadingRef.current = true
        incomingDeckRef.current = incomingDeck
        setIncomingDeck(incomingDeck)

        if (incomingDeck === 'a') setDeckAIndex(nextSongIndex)
        if (incomingDeck === 'b') setDeckBIndex(nextSongIndex)
      }
    },
    [
      activeDeck,
      crossfadeEnabled,
      currentList,
      getAudioRef,
      getDeckRef,
      getNextSongIndex,
      isSong,
      setProgress,
    ],
  )

  const setupInitialVolume = useCallback(
    (deck?: DeckId) => {
      const audio =
        isSong && deck ? getDeckRef(deck).current : getAudioRef().current
      if (!audio) return

      const targetVolume = getVolume() / 100
      if (isSong && deck && deck !== activeDeck) {
        audio.volume = 0
        return
      }
      audio.volume = targetVolume
    },
    [activeDeck, getAudioRef, getDeckRef, isSong],
  )

  const sendFinishProgress = useCallback(() => {
    if (!isPodcast || !podcast) return

    podcasts
      .saveEpisodeProgress(podcast.id, podcast.duration)
      .then(() => {
        logger.info('Complete progress sent:', podcast.duration)
      })
      .catch((error) => {
        logger.error('Error sending complete progress', error)
      })
  }, [isPodcast, podcast])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => clearFade()
  }, [clearFade])

  function getTrackReplayGain(track?: typeof song): ReplayGainParams {
    const preAmp = replayGainPreAmp
    const defaultGain = replayGainDefaultGain

    if (!track || !track.replayGain) {
      return { gain: defaultGain, peak: 1, preAmp }
    }

    if (replayGainType === 'album') {
      const { albumGain = defaultGain, albumPeak = 1 } = track.replayGain
      return { gain: albumGain, peak: albumPeak, preAmp }
    }

    const { trackGain = defaultGain, trackPeak = 1 } = track.replayGain
    return { gain: trackGain, peak: trackPeak, preAmp }
  }

  const audioNodes = (
    <>
      {isSong && deckASong && (
        <MemoAudioPlayer
          key="song-deck-a"
          replayGain={getTrackReplayGain(deckASong)}
          src={getSongStreamUrl(deckASong.id)}
          autoPlay={isPlaying}
          shouldPlay={isPlaying && (activeDeck === 'a' || incomingDeck === 'a')}
          ignoreErrors={activeDeck !== 'a' && incomingDeck !== 'a'}
          audioRef={songDeckARef}
          onPlay={() => {
            if (activeDeck === 'a') setPlayingState(true)
          }}
          onPause={() => {
            if (activeDeck === 'a') setPlayingState(false)
          }}
          onLoadedMetadata={() => setupDuration('a')}
          onTimeUpdate={() => setupProgress('a')}
          onEnded={() => {
            if (activeDeck === 'a') handleSongEnded()
          }}
          onLoadStart={() => setupInitialVolume('a')}
          data-testid="player-song-audio-a"
        />
      )}

      {isSong && deckBSong && (
        <MemoAudioPlayer
          key="song-deck-b"
          replayGain={getTrackReplayGain(deckBSong)}
          src={getSongStreamUrl(deckBSong.id)}
          autoPlay={isPlaying}
          shouldPlay={isPlaying && (activeDeck === 'b' || incomingDeck === 'b')}
          ignoreErrors={activeDeck !== 'b' && incomingDeck !== 'b'}
          audioRef={songDeckBRef}
          onPlay={() => {
            if (activeDeck === 'b') setPlayingState(true)
          }}
          onPause={() => {
            if (activeDeck === 'b') setPlayingState(false)
          }}
          onLoadedMetadata={() => setupDuration('b')}
          onTimeUpdate={() => setupProgress('b')}
          onEnded={() => {
            if (activeDeck === 'b') handleSongEnded()
          }}
          onLoadStart={() => setupInitialVolume('b')}
          data-testid="player-song-audio-b"
        />
      )}

      {isRadio && radio && (
        <MemoAudioPlayer
          src={radio.streamUrl}
          autoPlay={isPlaying}
          audioRef={radioRef}
          onPlay={() => setPlayingState(true)}
          onPause={() => setPlayingState(false)}
          onLoadStart={setupInitialVolume}
          data-testid="player-radio-audio"
        />
      )}

      {isPodcast && podcast && (
        <MemoAudioPlayer
          src={getProxyURL(podcast.audio_url)}
          autoPlay={isPlaying}
          audioRef={podcastRef}
          preload="auto"
          onPlay={() => setPlayingState(true)}
          onPause={() => setPlayingState(false)}
          onLoadedMetadata={setupDuration}
          onTimeUpdate={setupProgress}
          onEnded={() => {
            sendFinishProgress()
            handleSongEnded()
          }}
          onLoadStart={setupInitialVolume}
          data-testid="player-podcast-audio"
        />
      )}
    </>
  )

  return (
    <>
      {!hideUi && (
        <footer className="border-t h-[--player-height] w-full flex items-center fixed bottom-0 left-0 right-0 z-40 bg-background overflow-hidden">
          {backgroundImage && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'left center',
                filter: 'blur(60px)',
                opacity: 0.3,
                transform: 'scale(1.1)',
                maskImage:
                  'linear-gradient(to right, black 0%, black 40%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to right, black 0%, black 40%, transparent 100%)',
              }}
            />
          )}

          <div className="w-full h-full grid grid-cols-player gap-2 px-4 relative z-10">
            <div className="flex items-center gap-2 w-full">
              {isSong && <MemoTrackInfo song={song} />}
              {isRadio && <MemoRadioInfo radio={radio} />}
              {isPodcast && <MemoPodcastInfo podcast={podcast} />}
            </div>

            <div className="col-span-2 flex flex-col justify-center items-center px-4 gap-1">
              <MemoPlayerControls
                song={song}
                radio={radio}
                podcast={podcast}
                audioRef={getAudioRef()}
              />

              {(isSong || isPodcast) && (
                <MemoPlayerProgress audioRef={getAudioRef()} />
              )}
            </div>

            <div className="flex items-center w-full justify-end">
              <div className="flex items-center gap-1">
                {isSong && (
                  <>
                    <MemoPlayerLikeButton disabled={!song} />
                    <SonaDjButton variant="player" />
                    <MemoLyricsButton disabled={!song} />
                    <MemoPlayerQueueButton disabled={!song} />
                  </>
                )}
                {isPodcast && <MemoPodcastPlaybackRate />}
                {(isRadio || isPodcast) && (
                  <MemoPlayerClearQueueButton disabled={!radio && !podcast} />
                )}

                <MemoPlayerVolume
                  audioRef={getAudioRef()}
                  disabled={!song && !radio && !podcast}
                />

              </div>
            </div>
          </div>
        </footer>
      )}

      {audioNodes}
    </>
  )
}
