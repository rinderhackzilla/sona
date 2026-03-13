import { useCallback, useEffect, useRef, useState } from 'react'
import { ProgressSlider } from '@/app/components/ui/slider'
import {
  usePlayerActions,
  usePlayerDuration,
  usePlayerIsPlaying,
  usePlayerProgress,
  usePlayerRef,
} from '@/store/player.store'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'
import { useRenderCounter } from '@/app/hooks/use-render-counter'

export function FullscreenProgress() {
  useRenderCounter('FullscreenProgress')
  const UPDATE_INTERVAL_MS = 250
  const progress = usePlayerProgress()
  const [localProgress, setLocalProgress] = useState(progress)
  const [sliderProgress, setSliderProgress] = useState(progress)
  const sliderProgressRef = useRef(progress)
  const visualProgressRef = useRef(progress)
  const progressRef = useRef(progress)
  const audioPlayerRef = usePlayerRef()
  const currentDuration = usePlayerDuration()
  const isPlaying = usePlayerIsPlaying()
  const { setProgress } = usePlayerActions()
  const isSeekingRef = useRef(false)
  const currentTimeRef = useRef<HTMLDivElement>(null)
  const durationTimeRef = useRef<HTMLDivElement>(null)
  const currentDurationRef = useRef(currentDuration ?? 0)
  const [showRemaining, setShowRemaining] = useState(false)
  const showRemainingRef = useRef(showRemaining)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const resolveAudioElement = useCallback(() => {
    if (audioPlayerRef) return audioPlayerRef

    const fallbackCandidates = [
      'audio[data-testid="player-song-audio-a"]',
      'audio[data-testid="player-song-audio-b"]',
      'audio[data-testid="player-podcast-audio"]',
      'audio[data-testid="player-radio-audio"]',
    ]

    const elements = fallbackCandidates
      .map(
        (selector) =>
          document.querySelector(selector) as HTMLAudioElement | null,
      )
      .filter(Boolean) as HTMLAudioElement[]

    const active = elements.find(
      (audio) => !audio.paused && audio.readyState > 0,
    )
    return active ?? elements[0] ?? null
  }, [audioPlayerRef])

  const updateAudioCurrentTime = useCallback(
    (value: number) => {
      isSeekingRef.current = false
      const audio = resolveAudioElement()
      if (audio) {
        audio.currentTime = value
      }
    },
    [resolveAudioElement],
  )

  const writeTimeLabels = useCallback((value: number) => {
    if (currentTimeRef.current) {
      currentTimeRef.current.textContent = convertSecondsToTime(value)
    }

    if (durationTimeRef.current) {
      if (showRemainingRef.current) {
        durationTimeRef.current.textContent = `-${convertSecondsToTime(
          Math.max(0, currentDurationRef.current - value),
        )}`
      } else {
        durationTimeRef.current.textContent = convertSecondsToTime(
          currentDurationRef.current,
        )
      }
    }
  }, [])

  const handleSeeking = useCallback((amount: number) => {
    isSeekingRef.current = true
    setLocalProgress(amount)
    sliderProgressRef.current = amount
    visualProgressRef.current = amount
    setSliderProgress(amount)
    writeTimeLabels(amount)
  }, [writeTimeLabels])

  const handleSeeked = useCallback(
    (amount: number) => {
      updateAudioCurrentTime(amount)
      setProgress(amount)
      setLocalProgress(amount)
      sliderProgressRef.current = amount
      visualProgressRef.current = amount
      setSliderProgress(amount)
      writeTimeLabels(amount)
    },
    [setProgress, updateAudioCurrentTime, writeTimeLabels],
  )

  const handleSeekedFallback = useCallback(() => {
    // Only fallback when Radix commit did not fire.
    if (!isSeekingRef.current) return
    updateAudioCurrentTime(localProgress)
    setProgress(localProgress)
    setLocalProgress(localProgress)
    sliderProgressRef.current = localProgress
    visualProgressRef.current = localProgress
    setSliderProgress(localProgress)
    writeTimeLabels(localProgress)
  }, [localProgress, setProgress, updateAudioCurrentTime, writeTimeLabels])

  useEffect(() => {
    currentDurationRef.current = currentDuration ?? 0
    const active =
      isSeekingRef.current ? localProgress : visualProgressRef.current
    writeTimeLabels(active)
  }, [currentDuration, localProgress, writeTimeLabels])

  useEffect(() => {
    showRemainingRef.current = showRemaining
    const active =
      isSeekingRef.current ? localProgress : visualProgressRef.current
    writeTimeLabels(active)
  }, [localProgress, showRemaining, writeTimeLabels])

  useEffect(() => {
    if (isSeekingRef.current) return
    if (!isPlaying) {
      const next = progressRef.current
      sliderProgressRef.current = next
      visualProgressRef.current = next
      setSliderProgress(next)
      writeTimeLabels(next)
      return
    }

    const audio = resolveAudioElement()
    const syncProgress = () => {
      if (isSeekingRef.current) return
      const next = audio?.currentTime ?? progressRef.current
      if (Math.abs(visualProgressRef.current - next) > 0.015) {
        visualProgressRef.current = next
        writeTimeLabels(next)

        if (Math.abs(sliderProgressRef.current - next) > 0.12) {
          sliderProgressRef.current = next
          setSliderProgress(next)
        }
      }
    }

    syncProgress()
    const intervalId = window.setInterval(syncProgress, UPDATE_INTERVAL_MS)
    audio?.addEventListener('timeupdate', syncProgress)

    return () => {
      window.clearInterval(intervalId)
      audio?.removeEventListener('timeupdate', syncProgress)
    }
  }, [isPlaying, resolveAudioElement, writeTimeLabels])

  const activeProgress = isSeekingRef.current ? localProgress : sliderProgress

  return (
    <div className="flex items-center gap-3">
      <div
        ref={currentTimeRef}
        className="min-w-[50px] max-w-[60px] text-right drop-shadow-lg"
      >
        {convertSecondsToTime(activeProgress)}
      </div>

      <ProgressSlider
        variant="default"
        defaultValue={[0]}
        value={[activeProgress]}
        tooltipTransformer={convertSecondsToTime}
        max={currentDuration}
        step={1}
        className="w-full h-4 fullscreen-progress-slider"
        onValueChange={([value]) => handleSeeking(value)}
        onValueCommit={([value]) => handleSeeked(value)}
        onPointerUp={handleSeekedFallback}
        onMouseUp={handleSeekedFallback}
      />

      <div
        ref={durationTimeRef}
        className="min-w-[50px] max-w-[60px] text-left drop-shadow-lg cursor-pointer select-none"
        onClick={() => setShowRemaining((v) => !v)}
      >
        {showRemaining
          ? `-${convertSecondsToTime(Math.max(0, (currentDuration ?? 0) - activeProgress))}`
          : convertSecondsToTime(currentDuration ?? 0)}
      </div>
    </div>
  )
}
