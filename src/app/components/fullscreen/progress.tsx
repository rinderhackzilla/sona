import { useCallback, useEffect, useRef, useState } from 'react'
import { ProgressSlider } from '@/app/components/ui/slider'
import {
  usePlayerActions,
  usePlayerDuration,
  usePlayerProgress,
  usePlayerRef,
} from '@/store/player.store'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'

export function FullscreenProgress({ active = true }: { active?: boolean }) {
  const progress = usePlayerProgress()
  const [localProgress, setLocalProgress] = useState(progress)
  const audioPlayerRef = usePlayerRef()
  const currentDuration = usePlayerDuration()
  const { setProgress } = usePlayerActions()
  const isSeekingRef = useRef(false)
  const [showRemaining, setShowRemaining] = useState(false)

  useEffect(() => {
    if (!isSeekingRef.current) {
      setLocalProgress(progress)
    }
  }, [progress])

  const resolveAudioElement = useCallback(() => {
    if (audioPlayerRef) return audioPlayerRef

    const fallbackCandidates = [
      'audio[data-testid="player-song-audio-a"]',
      'audio[data-testid="player-song-audio-b"]',
      'audio[data-testid="player-podcast-audio"]',
      'audio[data-testid="player-radio-audio"]',
    ]

    for (const selector of fallbackCandidates) {
      const el = document.querySelector(selector) as HTMLAudioElement | null
      if (el) return el
    }

    return null
  }, [audioPlayerRef])

  const updateAudioCurrentTime = useCallback(
    (value: number) => {
      const audio = resolveAudioElement()
      if (audio) audio.currentTime = value
    },
    [resolveAudioElement],
  )

  const handleSeeking = useCallback((amount: number) => {
    isSeekingRef.current = true
    setLocalProgress(amount)
  }, [])

  const handleSeeked = useCallback(
    (amount: number) => {
      isSeekingRef.current = false
      updateAudioCurrentTime(amount)
      setProgress(amount)
      setLocalProgress(amount)
    },
    [setProgress, updateAudioCurrentTime],
  )

  const handleSeekedFallback = useCallback(() => {
    if (!isSeekingRef.current) return
    isSeekingRef.current = false

    if (localProgress !== progress) {
      updateAudioCurrentTime(localProgress)
      setProgress(localProgress)
    }
  }, [localProgress, progress, setProgress, updateAudioCurrentTime])

  const activeProgress = isSeekingRef.current ? localProgress : progress

  if (!active) {
    return (
      <div className="flex items-center gap-3 opacity-0 pointer-events-none">
        <div className="min-w-[50px] max-w-[60px] text-right drop-shadow-lg">
          {convertSecondsToTime(activeProgress)}
        </div>
        <div className="w-full h-4" />
        <div className="min-w-[50px] max-w-[60px] text-left drop-shadow-lg">
          {convertSecondsToTime(currentDuration ?? 0)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[50px] max-w-[60px] text-right drop-shadow-lg">
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
