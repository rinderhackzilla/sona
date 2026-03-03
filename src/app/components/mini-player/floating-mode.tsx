import { ArrowLeftIcon, PinIcon, PinOffIcon, XIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import { SimpleTooltip } from '@/app/components/ui/simple-tooltip'
import {
  usePlayerCurrentList,
  usePlayerCurrentSong,
} from '@/store/player.store'
import { useMiniPlayerState } from '@/store/ui.store'
import { MiniPlayerControls } from './controls'
import { MiniPlayerProgress } from './progress'
import { MiniPlayerSongImage } from './song-image'
import { MiniPlayerSongTitle } from './song-title'

export function FloatingMiniPlayer() {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const currentSong = usePlayerCurrentSong()
  const currentList = usePlayerCurrentList()
  const { open, pinned, setOpen, togglePinned } = useMiniPlayerState()

  useEffect(() => {
    if (!open || pinned) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!panelRef.current || !target) return
      if (!panelRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [open, pinned, setOpen])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background/92 backdrop-blur-md">
      {!pinned && (
        <button
          className="absolute inset-0"
          onClick={() => setOpen(false)}
          type="button"
          aria-label="Close mini player overlay"
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="relative w-full max-w-[520px] rounded-2xl border border-border/70 bg-background/95 backdrop-blur-md shadow-[0_20px_40px_hsl(var(--background)/0.5)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/55 bg-accent/20">
            <div className="flex items-center gap-1">
              <SimpleTooltip text={t('player.tooltips.miniPlayer.close')}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setOpen(false)}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </SimpleTooltip>
              <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {t('player.tooltips.miniPlayer.open', 'Open Miniplayer')}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <SimpleTooltip
                text={
                  pinned
                    ? t('player.tooltips.miniPlayer.unpin', 'Unpin Miniplayer')
                    : t('player.tooltips.miniPlayer.pin', 'Pin Miniplayer')
                }
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={togglePinned}
                >
                  {pinned ? (
                    <PinIcon className="w-4 h-4 text-primary" />
                  ) : (
                    <PinOffIcon className="w-4 h-4" />
                  )}
                </Button>
              </SimpleTooltip>
              <SimpleTooltip text={t('player.tooltips.miniPlayer.close')}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setOpen(false)}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </SimpleTooltip>
            </div>
          </div>

          {currentList.length > 0 && currentSong?.id ? (
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 items-center">
                <div className="w-[88px] h-[88px]">
                  <MiniPlayerSongImage />
                </div>
                <div className="min-w-0 flex flex-col gap-2">
                  <MiniPlayerSongTitle />
                </div>
              </div>

              <MiniPlayerProgress />

              <div className="flex justify-center">
                <MiniPlayerControls />
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-muted-foreground text-center">
              {t('player.noPlayback', 'No playback active.')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
