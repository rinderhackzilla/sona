import { LyricsTab } from '@/app/components/fullscreen/lyrics'
import { useFullscreenLuminance } from '@/app/components/fullscreen/luminance-context'
import { CurrentSongInfo } from '@/app/components/queue/current-song-info'
import { QueueSongList } from '@/app/components/queue/song-list'
import { cn } from '@/lib/utils'

interface QueuePanelViewProps {
  inFullscreenOverlay?: boolean
}

export function QueuePanelView({
  inFullscreenOverlay = false,
}: QueuePanelViewProps) {
  const { useDarkForeground } = useFullscreenLuminance()

  return (
    <div
      className={cn(
        'flex w-full h-full gap-6',
        inFullscreenOverlay && 'items-stretch',
        inFullscreenOverlay &&
          (useDarkForeground
            ? 'fullscreen-panel-readable-light-bg'
            : 'fullscreen-panel-readable-dark-bg'),
      )}
    >
      <div
        className={cn(
          'shrink-0',
          inFullscreenOverlay && 'p-4',
        )}
      >
        <CurrentSongInfo />
      </div>
      <div
        className={cn(
          'flex-1 min-w-0',
          inFullscreenOverlay && 'p-4',
        )}
      >
        <QueueSongList inFullscreenOverlay={inFullscreenOverlay} />
      </div>
    </div>
  )
}

export function LyricsPanelView({
  inFullscreenOverlay = false,
}: {
  inFullscreenOverlay?: boolean
}) {
  const { useDarkForeground } = useFullscreenLuminance()

  return (
    <div
      className={cn(
        'w-full h-full',
        inFullscreenOverlay && 'p-5',
        inFullscreenOverlay &&
          (useDarkForeground
            ? 'fullscreen-panel-readable-light-bg'
            : 'fullscreen-panel-readable-dark-bg'),
      )}
    >
      <LyricsTab />
    </div>
  )
}
