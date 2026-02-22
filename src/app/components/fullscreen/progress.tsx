import { useCallback, useEffect, useState } from 'react'
import { ProgressSlider } from '@/app/components/ui/slider'
import {
  usePlayerActions,
  usePlayerDuration,
  usePlayerIsPlaying,
  usePlayerProgress,
  usePlayerRef,
} from '@/store/player.store'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'

let isSeeking = false

export function FullscreenProgress() {
  const progress = usePlayerProgress()
  const [localProgress, setLocalProgress] = useState(progress)
  const [visualProgress, setVisualProgress] = useState(progress)
  const audioPlayerRef = usePlayerRef()
  const currentDuration = usePlayerDuration()
  const isPlaying = usePlayerIsPlaying()
  const { setProgress } = usePlayerActions()

  const updateAudioCurrentTime = useCallback(
    (value: number) => {
      isSeeking = false
      if (audioPlayerRef) {
        audioPlayerRef.currentTime = value
      }
    },
    [audioPlayerRef],
  )

  const handleSeeking = useCallback((amount: number) => {
    isSeeking = true
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
    if (localProgress !== progress) {
      updateAudioCurrentTime(localProgress)
      setProgress(localProgress)
    }
    setVisualProgress(localProgress)
  }, [localProgress, progress, setProgress, updateAudioCurrentTime])

  useEffect(() => {
    if (isSeeking) return
    if (!isPlaying) {
      setVisualProgress(progress)
      return
    }

    let frameId: number
    const tick = () => {
      const next = audioPlayerRef?.currentTime ?? progress
      setVisualProgress((prev) => (Math.abs(prev - next) > 0.015 ? next : prev))
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [audioPlayerRef, isPlaying, isSeeking, progress])

  const [showRemaining, setShowRemaining] = useState(false)

  const activeProgress = isSeeking ? localProgress : visualProgress
  const currentTime = convertSecondsToTime(activeProgress)
  const remainingTime = `-${convertSecondsToTime((currentDuration ?? 0) - activeProgress)}`

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[50px] max-w-[60px] text-right drop-shadow-lg">
        {currentTime}
      </div>

      <ProgressSlider
        variant="secondary"
        defaultValue={[0]}
        value={[activeProgress]}
        tooltipTransformer={convertSecondsToTime}
        max={currentDuration}
        step={1}
        className="w-full h-4"
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
