import clsx from 'clsx'
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ProgressSlider } from '@/app/components/ui/slider'
import { podcasts } from '@/service/podcasts'
import { subsonic } from '@/service/subsonic'
import {
  usePlayerActions,
  usePlayerDuration,
  usePlayerIsPlaying,
  usePlayerMediaType,
  usePlayerProgress,
  usePlayerSonglist,
} from '@/store/player.store'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'
import { logger } from '@/utils/logger'

interface PlayerProgressProps {
  audioRef: RefObject<HTMLAudioElement>
}

export function PlayerProgress({ audioRef }: PlayerProgressProps) {
  const progress = usePlayerProgress()
  const [localProgress, setLocalProgress] = useState(progress)
  const [visualProgress, setVisualProgress] = useState(progress)
  const currentDuration = usePlayerDuration()
  const isPlaying = usePlayerIsPlaying()
  const { currentSong, currentList, podcastList, currentSongIndex } =
    usePlayerSonglist()
  const { isSong, isPodcast } = usePlayerMediaType()
  const { setProgress, setUpdatePodcastProgress, getCurrentPodcastProgress } =
    usePlayerActions()
  const isScrobbleSentRef = useRef(false)
  const isSeekingRef = useRef(false)

  const isEmpty = isSong && currentList.length === 0

  const updateAudioCurrentTime = useCallback(
    (value: number) => {
      isSeekingRef.current = false
      if (audioRef.current) {
        audioRef.current.currentTime = value
      }
    },
    [audioRef],
  )

  const handleSeeking = useCallback((amount: number) => {
    isSeekingRef.current = true
    setLocalProgress(amount)
    setVisualProgress(amount)
  }, [])

  // Fallback for cases where pointer-up/commit is not fired by the slider.
  useEffect(() => {
    if (!isSeekingRef.current) return

    const timeoutId = setTimeout(() => {
      isSeekingRef.current = false
    }, 1800)

    return () => clearTimeout(timeoutId)
  }, [localProgress])

  const handleSeeked = useCallback(
    (amount: number) => {
      updateAudioCurrentTime(amount)
      setProgress(amount)
      setLocalProgress(amount)
      setVisualProgress(amount)
    },
    [setProgress, updateAudioCurrentTime],
  )

  const handleSeekedFallback = useCallback(() => {
    if (localProgress !== progress) {
      updateAudioCurrentTime(localProgress)
      setProgress(localProgress)
    }
    setVisualProgress(localProgress)
  }, [localProgress, progress, setProgress, updateAudioCurrentTime])

  useEffect(() => {
    if (isSeekingRef.current) return
    if (!isPlaying) {
      setVisualProgress(progress)
      return
    }

    let frameId: number
    const tick = () => {
      const next = audioRef.current?.currentTime ?? progress
      setVisualProgress((prev) => (Math.abs(prev - next) > 0.015 ? next : prev))
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [audioRef, isPlaying, progress])

  const [showRemaining, setShowRemaining] = useState(false)

  const songDuration = useMemo(
    () => convertSecondsToTime(currentDuration ?? 0),
    [currentDuration],
  )

  const activeProgress = isSeekingRef.current ? localProgress : visualProgress
  const remainingTime = `-${convertSecondsToTime((currentDuration ?? 0) - activeProgress)}`

  const sendScrobble = useCallback(async (songId: string) => {
    await subsonic.scrobble.send(songId)
  }, [])

  const progressTicks = useRef(0)

  useEffect(() => {
    if (isSeekingRef.current || !isPlaying) {
      return
    }
    if (isSong) {
      const progressPercentage = (progress / currentDuration) * 100

      if (progressPercentage === 0) {
        isScrobbleSentRef.current = false
        progressTicks.current = 0
      } else {
        progressTicks.current += 1

        if (
          (progressTicks.current >= currentDuration / 2 ||
            progressTicks.current >= 60 * 4) &&
          !isScrobbleSentRef.current
        ) {
          void sendScrobble(currentSong.id)
            .then(() => {
              isScrobbleSentRef.current = true
            })
            .catch((error) => {
              logger.warn('Scrobble request failed', error)
            })
        }
      }
    }
  }, [
    progress,
    currentDuration,
    isSong,
    sendScrobble,
    currentSong.id,
    isPlaying,
  ])

  // Used to save listening progress to backend every 30 seconds
  useEffect(() => {
    if (!isPodcast || !podcastList) return
    if (progress === 0) return

    const send = (progress / 30) % 1 === 0
    if (!send) return

    const podcast = podcastList[currentSongIndex] ?? null
    if (!podcast) return

    const podcastProgress = getCurrentPodcastProgress()
    if (progress === podcastProgress) return

    setUpdatePodcastProgress(progress)

    podcasts
      .saveEpisodeProgress(podcast.id, progress)
      .then(() => {
        logger.info('Progress sent:', progress)
      })
      .catch((error) => {
        logger.error('Error sending progress', error)
      })
  }, [
    currentSongIndex,
    getCurrentPodcastProgress,
    isPodcast,
    podcastList,
    progress,
    setUpdatePodcastProgress,
  ])

  const currentTime = convertSecondsToTime(activeProgress)

  const isProgressLarge = useMemo(() => {
    return localProgress >= 3600 || progress >= 3600
  }, [localProgress, progress])

  const isDurationLarge = useMemo(() => {
    return currentDuration >= 3600
  }, [currentDuration])

  return (
    <div
      className={clsx(
        'flex w-full justify-center items-center gap-2',
        isEmpty && 'opacity-50',
      )}
    >
      <small
        className={clsx(
          'text-xs text-muted-foreground text-right',
          isProgressLarge ? 'min-w-14' : 'min-w-10',
        )}
        data-testid="player-current-time"
      >
        {currentTime}
      </small>
      {!isEmpty || isPodcast ? (
        <ProgressSlider
          defaultValue={[0]}
          value={[activeProgress]}
          tooltipTransformer={convertSecondsToTime}
          max={currentDuration}
          step={1}
          className="cursor-pointer w-[32rem] player-progress-slider"
          onValueChange={([value]) => handleSeeking(value)}
          onValueCommit={([value]) => handleSeeked(value)}
          // Sometimes onValueCommit doesn't work properly
          // so we also have to set the value on pointer/mouse up events
          // see https://github.com/radix-ui/primitives/issues/1760
          onPointerUp={handleSeekedFallback}
          onMouseUp={handleSeekedFallback}
          data-testid="player-progress-slider"
        />
      ) : (
        <ProgressSlider
          defaultValue={[0]}
          max={100}
          step={1}
          disabled={true}
          className="cursor-pointer w-[32rem] pointer-events-none player-progress-slider"
        />
      )}
      <small
        className={clsx(
          'text-xs text-muted-foreground text-left cursor-pointer select-none',
          isDurationLarge ? 'min-w-14' : 'min-w-10',
        )}
        data-testid="player-duration-time"
        onClick={() => setShowRemaining((v) => !v)}
      >
        {showRemaining ? remainingTime : songDuration}
      </small>
    </div>
  )
}
