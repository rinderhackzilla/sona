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

export function FullscreenProgress() {
  const progress = usePlayerProgress()
  const [localProgress, setLocalProgress] = useState(progress)
  const [visualProgress, setVisualProgress] = useState(progress)
  const audioPlayerRef = usePlayerRef()
  const currentDuration = usePlayerDuration()
  const isPlaying = usePlayerIsPlaying()
  const { setProgress } = usePlayerActions()
  const isSeekingRef = useRef(false)

  const resolveAudioElement = useCallback(() => {
    if (audioPlayerRef) return audioPlayerRef

    const fallbackCandidates = [
      'audio[data-testid="player-song-audio-a"]',
      'audio[data-testid="player-song-audio-b"]',
      'audio[data-testid="player-podcast-audio"]',
      'audio[data-testid="player-radio-audio"]',
    ]

    const elements = fallbackCandidates
      .map((selector) => document.querySelector(selector) as HTMLAudioElement | null)
      .filter(Boolean) as HTMLAudioElement[]

    const active = elements.find((audio) => !audio.paused && audio.readyState > 0)
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

  const handleSeeking = useCallback((amount: number) => {
    isSeekingRef.current = true
    setLocalProgress(amount)
    setVisualProgress(amount)
  }, [])

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
    // Only fallback when Radix commit did not fire.
    if (!isSeekingRef.current) return
    updateAudioCurrentTime(localProgress)
    setProgress(localProgress)
    setLocalProgress(localProgress)
    setVisualProgress(localProgress)
  }, [localProgress, setProgress, updateAudioCurrentTime])

  useEffect(() => {
    if (isSeekingRef.current) return
    if (!isPlaying) {
      setVisualProgress(progress)
      return
    }

    let frameId: number
    const tick = () => {
      const next = resolveAudioElement()?.currentTime ?? progress
      setVisualProgress((prev) => (Math.abs(prev - next) > 0.015 ? next : prev))
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [isPlaying, progress, resolveAudioElement])

  const [showRemaining, setShowRemaining] = useState(false)

  const activeProgress = isSeekingRef.current ? localProgress : visualProgress
  const currentTime = convertSecondsToTime(activeProgress)
  const remainingTime = `-${convertSecondsToTime((currentDuration ?? 0) - activeProgress)}`

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[50px] max-w-[60px] text-right drop-shadow-lg">
        {currentTime}
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
        className="min-w-[50px] max-w-[60px] text-left drop-shadow-lg cursor-pointer select-none"
        onClick={() => setShowRemaining((v) => !v)}
      >
        {showRemaining ? remainingTime : convertSecondsToTime(currentDuration ?? 0)}
      </div>
    </div>
  )
}
