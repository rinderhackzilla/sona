import { clsx } from 'clsx'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/app/components/ui/drawer'
import { useAppWindow } from '@/app/hooks/use-app-window'
import { useAlbumColorExtractor } from '@/app/hooks/useAlbumColorExtractor'
import { useFullscreenState } from '@/store/ui.store'
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
  const [isChromeVisible, setIsChromeVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isChromeVisibleRef = useRef(true)

  // Extract album colors automatically
  useAlbumColorExtractor()

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHideChrome = useCallback(() => {
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      isChromeVisibleRef.current = false
      setIsChromeVisible(false)
    }, 3000)
  }, [clearHideTimer])

  const revealChrome = useCallback(() => {
    if (!isChromeVisibleRef.current) {
      isChromeVisibleRef.current = true
      setIsChromeVisible(true)
    }
    scheduleHideChrome()
  }, [scheduleHideChrome])

  useEffect(() => {
    scheduleHideChrome()
    return () => clearHideTimer()
  }, [clearHideTimer, scheduleHideChrome])

  return (
    <>
      <MemoFullscreenBackdrop />
      <FullscreenDragHandler />
      <div
        className={clsx(
          'absolute inset-0 flex flex-col p-0 2xl:p-8 w-full h-full bg-black/0 z-10 transition-all duration-500 ease-in-out',
          isChromeVisible
            ? 'pt-6 2xl:pt-8 gap-4'
            : 'pt-8 2xl:pt-10 gap-1',
        )}
        onMouseMove={revealChrome}
        onMouseEnter={revealChrome}
        onMouseLeave={scheduleHideChrome}
      >
        <div
          className={clsx(
            'w-full flex-1 min-h-0 px-8 2xl:px-16 transition-all duration-500 ease-in-out',
            isChromeVisible ? 'pt-1 2xl:pt-2' : 'pt-0',
          )}
        >
          <div className="min-h-[300px] h-full max-h-full">
            <FullscreenTabs isChromeVisible={isChromeVisible} />
          </div>
        </div>

        <div
          className={clsx(
            'px-8 2xl:px-16 transition-all duration-500 ease-in-out',
            isChromeVisible
              ? 'h-[150px] min-h-[150px] py-2'
              : 'h-[112px] min-h-[112px] pt-0 pb-0',
          )}
        >
          <div
            className={clsx(
              'flex h-full transition-all duration-500 ease-in-out',
              isChromeVisible ? 'items-center' : 'items-end',
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
    <VisualizerProvider>
      <Drawer
        onAnimationEnd={handleFullscreen}
        fixed={true}
        handleOnly={true}
        disablePreventScroll={true}
        dismissible={true}
        modal={false}
      >
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerTitle className="sr-only">Big Player</DrawerTitle>
        <DrawerContent
          className="h-screen w-screen rounded-t-none border-none select-none cursor-default mt-0"
          showHandle={false}
          aria-describedby={undefined}
        >
          <FullscreenScene />
        </DrawerContent>
      </Drawer>
    </VisualizerProvider>
  )
}

export function FullscreenGlobal() {
  const { handleFullscreen } = useAppWindow()
  const { open, setOpen } = useFullscreenState()

  return (
    <VisualizerProvider>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        onAnimationEnd={handleFullscreen}
        fixed={true}
        handleOnly={true}
        disablePreventScroll={true}
        dismissible={true}
        modal={false}
      >
        <DrawerTitle className="sr-only">Big Player</DrawerTitle>
        <DrawerContent
          className="h-screen w-screen rounded-t-none border-none select-none cursor-default mt-0"
          showHandle={false}
          aria-describedby={undefined}
        >
          <FullscreenScene />
        </DrawerContent>
      </Drawer>
    </VisualizerProvider>
  )
}
