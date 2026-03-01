import { clsx } from 'clsx'
import { ComponentProps, memo } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/app/components/ui/drawer'
import { useAppWindow } from '@/app/hooks/use-app-window'
import { useAlbumColorExtractor } from '@/app/hooks/useAlbumColorExtractor'
import { useRenderCounter } from '@/app/hooks/use-render-counter'
import { useFullscreenState } from '@/store/ui.store'
import { useFullscreenChromeVisibility } from './use-fullscreen-chrome-visibility'
import { VisualizerProvider } from './settings'
import { FullscreenBackdrop } from './backdrop'
import { FullscreenDragHandler } from './drag-handler'
import { FullscreenPlayer } from './player'
import { FullscreenTabs } from './tabs'

const MemoFullscreenBackdrop = memo(FullscreenBackdrop)

type FullscreenModeProps = {
  children: React.ReactNode
}

function FullscreenScene() {
  useRenderCounter('FullscreenScene')
  const { isChromeVisible, revealChrome, scheduleHideChrome } =
    useFullscreenChromeVisibility(3000)

  // Extract album colors automatically
  useAlbumColorExtractor()

  return (
    <>
      <MemoFullscreenBackdrop />
      <FullscreenDragHandler />
      <div
        className={clsx(
          'absolute inset-0 flex flex-col p-0 2xl:p-8 w-full h-full bg-black/0 z-10 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
          isChromeVisible
            ? 'pt-6 2xl:pt-8 gap-4'
            : 'pt-6 2xl:pt-7 gap-2',
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
            <FullscreenTabs isChromeVisible={isChromeVisible} />
          </div>
        </div>

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

