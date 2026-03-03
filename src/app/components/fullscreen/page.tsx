import { clsx } from 'clsx'
import {
  ComponentProps,
  memo,
  useCallback,
  useEffect,
} from 'react'
import { LyricsTab } from '@/app/components/fullscreen/lyrics'
import { CurrentSongInfo } from '@/app/components/queue/current-song-info'
import { QueueSongList } from '@/app/components/queue/song-list'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/app/components/ui/drawer'
import { useAppWindow } from '@/app/hooks/use-app-window'
import { useRenderCounter } from '@/app/hooks/use-render-counter'
import { useAlbumColorExtractor } from '@/app/hooks/useAlbumColorExtractor'
import {
  useLyricsState,
  useMainDrawerState,
  useQueueState,
} from '@/store/player.store'
import { useFullscreenState } from '@/store/ui.store'
import { FullscreenBackdrop } from './backdrop'
import { FullscreenDragHandler } from './drag-handler'
import { FullscreenPlayer } from './player'
import { VisualizerProvider } from './settings'
import { FullscreenTabs } from './tabs'
import { useFullscreenChromeVisibility } from './use-fullscreen-chrome-visibility'

const MemoFullscreenBackdrop = memo(FullscreenBackdrop)
const MemoQueueSongList = memo(QueueSongList)
const MemoCurrentSongInfo = memo(CurrentSongInfo)
const MemoLyricsTab = memo(LyricsTab)

type FullscreenModeProps = {
  children: React.ReactNode
}

function FullscreenScene() {
  useRenderCounter('FullscreenScene')
  const { queueState } = useQueueState()
  const { lyricsState } = useLyricsState()
  const isPanelOpen = queueState || lyricsState
  const isPanelVisuallyActive = isPanelOpen
  const { isChromeVisible, revealChrome, scheduleHideChrome } =
    useFullscreenChromeVisibility(3000, isPanelOpen)

  // Extract album colors automatically
  useAlbumColorExtractor()

  return (
    <>
      <MemoFullscreenBackdrop />
      <FullscreenDragHandler />
      <div
        className={clsx(
          'absolute inset-0 flex flex-col p-0 2xl:p-8 w-full h-full bg-black/0 z-10 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
          isChromeVisible ? 'pt-6 2xl:pt-8 gap-4' : 'pt-6 2xl:pt-7 gap-2',
        )}
        onMouseMove={revealChrome}
        onMouseEnter={revealChrome}
        onMouseLeave={scheduleHideChrome}
      >
        <div
          className={clsx(
            'w-full flex-1 min-h-0 px-8 2xl:px-16 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
            isChromeVisible ? 'pt-1 2xl:pt-2' : 'pt-1',
          )}
        >
          <div className="min-h-[300px] h-full max-h-full">
            <FullscreenTabs
              isChromeVisible={isChromeVisible}
              isPanelOpen={isPanelVisuallyActive}
            />
          </div>
        </div>

        <FullscreenIntegratedPanel isOpen={isPanelOpen} />

        <div
          className={clsx(
            'px-8 2xl:px-16 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
            isChromeVisible
              ? 'h-[154px] min-h-[154px] py-2'
              : 'h-[102px] min-h-[102px] pt-0 pb-0',
          )}
        >
          <div
            className={clsx(
              'flex h-full transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
              isChromeVisible ? 'items-start' : 'items-end',
            )}
          >
            <FullscreenPlayer isChromeVisible={isChromeVisible} />
          </div>
        </div>
      </div>
    </>
  )
}

function FullscreenIntegratedPanel({ isOpen }: { isOpen: boolean }) {
  const { queueState, setQueueState } = useQueueState()
  const { lyricsState, setLyricsState } = useLyricsState()
  const { setMainDrawerState } = useMainDrawerState()

  const closePanel = useCallback(() => {
    setMainDrawerState(false)
    setQueueState(false)
    setLyricsState(false)
  }, [setLyricsState, setMainDrawerState, setQueueState])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      closePanel()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [closePanel, isOpen])

  return (
    <div
      className={clsx(
        'absolute left-8 right-8 2xl:left-16 2xl:right-16 top-0 bottom-[170px] 2xl:bottom-[188px] z-30 transform-gpu transition-[transform,opacity] duration-560 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        isOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-full pointer-events-none',
      )}
    >
      <div className="relative w-full h-full rounded-b-xl border-x border-b border-border/68 bg-background/88 shadow-[0_30px_68px_rgba(0,0,0,0.56)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-foreground/5 via-transparent to-background/8" />
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

export function FullscreenMode({ children }: FullscreenModeProps) {
  const { handleFullscreen } = useAppWindow()

  return (
    <FullscreenDrawer onAnimationEnd={handleFullscreen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
    </FullscreenDrawer>
  )
}

export function FullscreenGlobal() {
  const { handleFullscreen } = useAppWindow()
  const { open, setOpen } = useFullscreenState()

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
        {props.children}
        <DrawerTitle className="sr-only">Big Player</DrawerTitle>
        <DrawerContent
          className="fullscreen-drawer-content h-screen w-screen rounded-t-none border-none select-none cursor-default mt-0"
          showHandle={false}
          aria-describedby={undefined}
        >
          <FullscreenScene />
        </DrawerContent>
      </Drawer>
    </VisualizerProvider>
  )
}
