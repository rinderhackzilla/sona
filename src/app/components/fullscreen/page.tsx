import { clsx } from 'clsx'
import { type ComponentProps, type PointerEvent as ReactPointerEvent, memo, useCallback, useEffect, useRef, useState } from 'react'
import { WindowControlButtons } from '@/app/components/window-control-buttons'
import { LyricsTab } from '@/app/components/fullscreen/lyrics'
import { CurrentSongInfo } from '@/app/components/queue/current-song-info'
import { QueueSongList } from '@/app/components/queue/song-list'
import { Drawer, DrawerContent, DrawerTitle } from '@/app/components/ui/drawer'
import { useAppWindow } from '@/app/hooks/use-app-window'
import { useAlbumColorExtractor } from '@/app/hooks/useAlbumColorExtractor'
import {
  useLyricsState,
  useMainDrawerState,
  useQueueState,
  usePlayerStore,
} from '@/store/player.store'
import { useFullscreenState } from '@/store/ui.store'
import { isWindows } from '@/utils/desktop'
import { setDesktopTitleBarColors } from '@/utils/theme'
import { FullscreenBackdrop } from './backdrop'
import { FullscreenDragHandler } from './drag-handler'
import { FullscreenPlayer } from './player'
import { shouldIgnoreFullscreenOutsideClick } from './panel-controller'
import { FullscreenLuminanceProvider } from './luminance-context'
import { VisualizerProvider } from './settings'
import { FullscreenTabs } from './tabs'
import { useFullscreenChromeVisibility } from './use-fullscreen-chrome-visibility'

const MemoFullscreenBackdrop = memo(FullscreenBackdrop)
const MemoQueueSongList = memo(QueueSongList)
const MemoCurrentSongInfo = memo(CurrentSongInfo)
const MemoLyricsTab = memo(LyricsTab)

function FullscreenScene() {
  const { queueState } = useQueueState()
  const { lyricsState } = useLyricsState()
  const isPanelOpen = queueState || lyricsState
  const isPanelVisuallyActive = isPanelOpen
  const { isChromeVisible } = useFullscreenChromeVisibility(3000, isPanelOpen)
  const currentSongId = usePlayerStore((state) => state.songlist.currentSong.id)
  const [isSongTransitioning, setIsSongTransitioning] = useState(false)
  const lastSongIdRef = useRef(currentSongId)

  useEffect(() => {
    if (lastSongIdRef.current === currentSongId) return
    lastSongIdRef.current = currentSongId
    setIsSongTransitioning(true)
    const timeoutId = window.setTimeout(() => setIsSongTransitioning(false), 260)
    return () => window.clearTimeout(timeoutId)
  }, [currentSongId])
  useAlbumColorExtractor()

  return (
    <>
      <MemoFullscreenBackdrop />
      <FullscreenDragHandler />
      <FullscreenWindowControls isChromeVisible={isChromeVisible} />
      <div
        className={clsx(
          'absolute inset-0 z-[18] pointer-events-none transition-opacity duration-260',
          isSongTransitioning ? 'opacity-100' : 'opacity-0',
        )}
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      />
      <div
        className={clsx(
          'absolute inset-0 flex flex-col p-0 2xl:p-8 w-full h-full bg-black/0 z-10 transition-none',
          isChromeVisible ? 'pt-6 2xl:pt-8 gap-4' : 'pt-6 2xl:pt-7 gap-2',
        )}
      >
        <div
          className={clsx(
            'w-full flex-1 min-h-0 px-8 2xl:px-16 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
            isChromeVisible ? 'pt-1 2xl:pt-2 translate-y-0' : 'pt-1 translate-y-[51px]',
          )}
        >
          <div className="min-h-[300px] h-full max-h-full">
            <FullscreenTabs
              isChromeVisible={isChromeVisible}
              isPanelOpen={isPanelVisuallyActive}
            />
          </div>
        </div>

        <FullscreenIntegratedPanel
          isOpen={isPanelOpen}
          isChromeVisible={isChromeVisible}
        />

        <div
          className={clsx(
            'px-8 2xl:px-16 transition-none',
            isChromeVisible ? 'h-[154px] min-h-[154px] py-2' : 'h-[102px] min-h-[102px] pt-0 pb-0',
          )}
        >
          <div className={clsx('flex h-full', isChromeVisible ? 'items-start' : 'items-end')}>
            <FullscreenPlayer isChromeVisible={isChromeVisible} />
          </div>
        </div>
      </div>
    </>
  )
}

function FullscreenIntegratedPanel({
  isOpen,
  isChromeVisible,
}: {
  isOpen: boolean
  isChromeVisible: boolean
}) {
  const { queueState } = useQueueState()
  const { lyricsState } = useLyricsState()
  const { setActiveDrawerPanel } = useMainDrawerState()
  const panelRef = useRef<HTMLDivElement | null>(null)

  const closePanel = useCallback(() => {
    setActiveDrawerPanel(null)
  }, [setActiveDrawerPanel])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      closePanel()
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      if (panelRef.current?.contains(target)) return
      if (shouldIgnoreFullscreenOutsideClick(target)) return
      closePanel()
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [closePanel, isOpen])

  return (
    <div
      ref={panelRef}
      className={clsx(
        'absolute left-8 right-8 2xl:left-16 2xl:right-16 top-0 z-30 transform-gpu transition-[transform,opacity] duration-260 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        isChromeVisible ? 'bottom-[170px] 2xl:bottom-[188px]' : 'bottom-[110px]',
        isOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-full pointer-events-none',
      )}
    >
      <div className="relative w-full h-full rounded-b-[var(--radius-surface)] border-x border-b border-border/55 bg-background shadow-[0_12px_28px_rgba(0,0,0,0.28)] overflow-hidden">
        <div className="flex w-full h-full gap-6 px-5 pt-11 pb-4 2xl:pt-12">
          {queueState && (
            <>
              <MemoCurrentSongInfo />
              <div className="flex-1 relative min-w-0">
                <div className="w-full h-full">
                  <MemoQueueSongList inFullscreenOverlay />
                </div>
              </div>
            </>
          )}
          {lyricsState && !queueState && (
            <div className="w-full h-full">
              <MemoLyricsTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FullscreenWindowControls({
  isChromeVisible,
}: {
  isChromeVisible: boolean
}) {
  if (!isWindows) return null

  const blockNativeOverlayHit = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      className={clsx(
        'absolute top-0 right-0 z-40 transition-opacity duration-200',
        isChromeVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
    >
      <div
        className="absolute top-0 right-0 h-12 w-[170px] pointer-events-auto"
        onPointerDown={blockNativeOverlayHit}
      />
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
        <WindowControlButtons />
      </div>
    </div>
  )
}
export function FullscreenGlobal() {
  const { handleFullscreen } = useAppWindow()
  const { open, setOpen } = useFullscreenState()

  useEffect(() => {
    setDesktopTitleBarColors(open)
  }, [open])

  return (
    <FullscreenDrawer
      open={open}
      onOpenChange={setOpen}
      onAnimationEnd={handleFullscreen}
    />
  )
}

type FullscreenDrawerProps = ComponentProps<typeof Drawer>

function FullscreenDrawer(props: FullscreenDrawerProps) {
  const isOpen = Boolean(props.open)

  return (
    <VisualizerProvider>
      <Drawer
        fixed={true}
        handleOnly={true}
        disablePreventScroll={true}
        dismissible={true}
        modal={false}
        {...props}
      >
        <DrawerTitle className="sr-only">Big Player</DrawerTitle>
        <DrawerContent
          className="fullscreen-drawer-content h-screen w-screen rounded-t-none border-none select-none cursor-default mt-0"
          showHandle={false}
          aria-describedby={undefined}
        >
          {isOpen ? (
            <FullscreenLuminanceProvider>
              <FullscreenScene />
            </FullscreenLuminanceProvider>
          ) : null}
        </DrawerContent>
      </Drawer>
    </VisualizerProvider>
  )
}







