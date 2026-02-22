import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { getSongStreamUrl, getCoverArtUrl } from '@/api/httpClient'
import { getProxyURL } from '@/api/podcastClient'
import { MiniPlayerButton } from '@/app/components/mini-player/button'
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
  usePlayerRef,
  usePlayerSonglist,
  usePlayerStore,
  useReplayGainState,
} from '@/store/player.store'
import { LoopState } from '@/types/playerContext'
import { hasPiPSupport } from '@/utils/browser'
import { logger } from '@/utils/logger'
import { ReplayGainParams } from '@/utils/replayGain'
import { AudioPlayer } from './audio'
import { PlayerClearQueueButton } from './clear-queue-button'
import { PlayerControls } from './controls'
import { EqualizerButton } from './equalizer-button'
import { PlayerExpandButton } from './expand-button'
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
const MemoEqualizerButton = memo(EqualizerButton)
const MemoPlayerVolume = memo(PlayerVolume)
const MemoPlayerExpandButton = memo(PlayerExpandButton)
const MemoPodcastPlaybackRate = memo(PodcastPlaybackRate)
const MemoLyricsButton = memo(PlayerLyricsButton)
const MemoMiniPlayerButton = memo(MiniPlayerButton)
const MemoAudioPlayer = memo(AudioPlayer)

export function Player({ hideUi = false }: { hideUi?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const radioRef = useRef<HTMLAudioElement>(null)
  const podcastRef = useRef<HTMLAudioElement>(null)
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fadeOutStartedRef = useRef(false)
  const {
    setAudioPlayerRef,
    setCurrentDuration,
    setProgress,
    setPlayingState,
    handleSongEnded,
    getCurrentProgress,
    getCurrentPodcastProgress,
  } = usePlayerActions()
  const { currentList, currentSongIndex, radioList, podcastList } =
    usePlayerSonglist()
  const isPlaying = usePlayerIsPlaying()
  const { isSong, isRadio, isPodcast } = usePlayerMediaType()
  const loopState = usePlayerLoop()
  const { hasNext } = usePlayerPrevAndNext()
  const audioPlayerRef = usePlayerRef()
  const currentPlaybackRate = usePlayerStore().playerState.currentPlaybackRate
  const { replayGainType, replayGainPreAmp, replayGainDefaultGain } =
    useReplayGainState()
  const { enabled: crossfadeEnabled } = useCrossfadeSettings()

  const CROSSFADE_DURATION_S = 3

  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current !== null) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
  }, [])

  const startFadeVolume = useCallback(
    (audio: HTMLAudioElement, targetVolume: number, durationMs: number) => {
      clearFade()
      const startVol = audio.volume
      const steps = Math.max(10, Math.floor(durationMs / 30))
      const stepMs = durationMs / steps
      const delta = (targetVolume - startVol) / steps
      let step = 0
      fadeIntervalRef.current = setInterval(() => {
        step++
        audio.volume = Math.max(0, Math.min(1, startVol + delta * step))
        if (step >= steps) clearFade()
      }, stepMs)
    },
    [clearFade],
  )

  const song = currentList[currentSongIndex]
  const radio = radioList[currentSongIndex]
  const podcast = podcastList[currentSongIndex]

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

  const getAudioRef = useCallback(() => {
    if (isRadio) return radioRef
    if (isPodcast) return podcastRef

    return audioRef
  }, [isPodcast, isRadio])

  // biome-ignore lint/correctness/useExhaustiveDependencies: audioRef needed
  useEffect(() => {
    if (!isSong && !song) return

    if (audioRef.current && audioPlayerRef !== audioRef.current)
      setAudioPlayerRef(audioRef.current)
  }, [audioPlayerRef, audioRef, isSong, setAudioPlayerRef, song])

  useEffect(() => {
    const audio = podcastRef.current
    if (!audio || !isPodcast) return

    audio.playbackRate = currentPlaybackRate
  }, [currentPlaybackRate, isPodcast])

  const setupDuration = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    const audioDuration = Math.floor(audio.duration)
    const infinityDuration = audioDuration === Infinity

    if (!infinityDuration) {
      setCurrentDuration(audioDuration)
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
      const progress = getCurrentProgress()
      audio.currentTime = progress
    }
  }, [
    getAudioRef,
    isPodcast,
    podcast,
    setCurrentDuration,
    getCurrentPodcastProgress,
    setProgress,
    getCurrentProgress,
  ])

  const setupProgress = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    const currentProgress = Math.floor(audio.currentTime)
    setProgress(currentProgress)

    if (
      crossfadeEnabled &&
      isSong &&
      (hasNext || loopState === LoopState.All) &&
      !fadeOutStartedRef.current &&
      isFinite(audio.duration) &&
      audio.duration > CROSSFADE_DURATION_S * 2
    ) {
      const timeLeft = audio.duration - audio.currentTime
      if (timeLeft > 0 && timeLeft <= CROSSFADE_DURATION_S) {
        fadeOutStartedRef.current = true
        startFadeVolume(audio, 0, timeLeft * 1000)
      }
    }
  }, [
    getAudioRef,
    setProgress,
    crossfadeEnabled,
    isSong,
    hasNext,
    loopState,
    startFadeVolume,
  ])

  const setupInitialVolume = useCallback(() => {
    const audio = getAudioRef().current
    if (!audio) return

    const targetVolume = getVolume() / 100
    if (crossfadeEnabled && isSong) {
      audio.volume = 0
      startFadeVolume(audio, targetVolume, CROSSFADE_DURATION_S * 1000)
    } else {
      audio.volume = targetVolume
    }
  }, [getAudioRef, crossfadeEnabled, isSong, startFadeVolume])

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

  // Reset crossfade state when a new song starts
  useEffect(() => {
    fadeOutStartedRef.current = false
    clearFade()
  }, [song?.id, clearFade])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => clearFade()
  }, [clearFade])

  function getTrackReplayGain(): ReplayGainParams {
    const preAmp = replayGainPreAmp
    const defaultGain = replayGainDefaultGain

    if (!song || !song.replayGain) {
      return { gain: defaultGain, peak: 1, preAmp }
    }

    if (replayGainType === 'album') {
      const { albumGain = defaultGain, albumPeak = 1 } = song.replayGain
      return { gain: albumGain, peak: albumPeak, preAmp }
    }

    const { trackGain = defaultGain, trackPeak = 1 } = song.replayGain
    return { gain: trackGain, peak: trackPeak, preAmp }
  }

  const audioNodes = (
    <>
      {isSong && song && (
        <MemoAudioPlayer
          key={`${song.id}-${currentSongIndex}`}
          replayGain={getTrackReplayGain()}
          src={getSongStreamUrl(song.id)}
          autoPlay={isPlaying}
          audioRef={audioRef}
          loop={loopState === LoopState.One}
          onPlay={() => setPlayingState(true)}
          onPause={() => setPlayingState(false)}
          onLoadedMetadata={setupDuration}
          onTimeUpdate={setupProgress}
          onEnded={handleSongEnded}
          onLoadStart={setupInitialVolume}
          data-testid="player-song-audio"
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
          {/* Blurred Album Cover Background */}
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
            {/* Track Info */}
            <div className="flex items-center gap-2 w-full">
              {isSong && <MemoTrackInfo song={song} />}
              {isRadio && <MemoRadioInfo radio={radio} />}
              {isPodcast && <MemoPodcastInfo podcast={podcast} />}
            </div>
            {/* Main Controls */}
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
            {/* Remain Controls and Volume */}
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

                <MemoEqualizerButton disabled={!song && !radio && !podcast} />

                <MemoPlayerVolume
                  audioRef={getAudioRef()}
                  disabled={!song && !radio && !podcast}
                />

                {isSong && <MemoPlayerExpandButton disabled={!song} />}
                {isSong && hasPiPSupport && <MemoMiniPlayerButton />}
              </div>
            </div>
          </div>
        </footer>
      )}

      {audioNodes}
    </>
  )
}
