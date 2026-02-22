import { useCallback, useState } from 'react'
import { ProgressSlider } from '@/app/components/ui/slider'
import {
  usePlayerActions,
  usePlayerCurrentSong,
  usePlayerDuration,
  usePlayerProgress,
  usePlayerRef,
} from '@/store/player.store'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'

let isSeeking = false

export function MiniPlayerProgress() {
  const progress = usePlayerProgress()
  const [localProgress, setLocalProgress] = useState(progress)
  const audioPlayerRef = usePlayerRef()
  const currentDuration = usePlayerDuration()
  const currentSong = usePlayerCurrentSong()
  const { setProgress } = usePlayerActions()
  const effectiveDuration = Math.max(
    1,
    Number(currentDuration ?? currentSong?.duration ?? 0),
  )

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
  }, [])

  const handleSeeked = useCallback(
    (amount: number) => {
      updateAudioCurrentTime(amount)
      setProgress(amount)
      setLocalProgress(amount)
    },
    [setProgress, updateAudioCurrentTime],
  )

  const handleSeekedFallback = useCallback(() => {
    if (localProgress !== progress) {
      updateAudioCurrentTime(localProgress)
      setProgress(localProgress)
    }
  }, [localProgress, progress, setProgress, updateAudioCurrentTime])

  const currentTime = convertSecondsToTime(isSeeking ? localProgress : progress)

  return (
    <div className="flex items-center flex-col">
      <div className="w-full flex justify-between text-foreground/70">
        <div className="min-w-[40px] text-left text-[11px] font-light drop-shadow-md">
          {currentTime}
        </div>

        <div className="min-w-[40px] text-right text-[11px] font-light drop-shadow-md">
          {convertSecondsToTime(effectiveDuration)}
        </div>
      </div>

      <ProgressSlider
        variant="secondary"
        defaultValue={[0]}
        value={isSeeking ? [localProgress] : [progress]}
        tooltipTransformer={convertSecondsToTime}
        max={effectiveDuration}
        step={1}
        className="w-full h-4 cursor-pointer"
        onValueChange={([value]) => handleSeeking(value)}
        onValueCommit={([value]) => handleSeeked(value)}
        onPointerUp={handleSeekedFallback}
        onMouseUp={handleSeekedFallback}
        data-testid="mini-player-progress-slider"
      />
    </div>
  )
}
