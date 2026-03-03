import { clsx } from 'clsx'
import { ListVideo, MicVocalIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import {
  useLyricsState,
  useMainDrawerState,
  useQueueState,
} from '@/store/player.store'
import { CloseFullscreenButton } from './buttons'
import { FullscreenControls } from './controls'
import { LikeButton } from './like-button'
import { FullscreenProgress } from './progress'
import { FullscreenSettings } from './settings'
import { SonaDjButton } from './sona-dj'
import { VolumeContainer } from './volume-container'

interface FullscreenPlayerProps {
  isChromeVisible: boolean
}

type PanelTarget = 'queue' | 'lyrics'
type SwitchPhase = 'idle' | 'closing_for_switch'
const PANEL_SWITCH_DELAY_MS = 420

export function FullscreenPlayer({ isChromeVisible }: FullscreenPlayerProps) {
  const { queueState, setQueueState } = useQueueState()
  const { lyricsState, setLyricsState } = useLyricsState()
  const { setMainDrawerState } = useMainDrawerState()
  const panelSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const switchPhaseRef = useRef<SwitchPhase>('idle')

  const clearSwitchTimer = () => {
    if (panelSwitchTimerRef.current) {
      clearTimeout(panelSwitchTimerRef.current)
      panelSwitchTimerRef.current = null
    }
    switchPhaseRef.current = 'idle'
  }

  const switchPanel = (target: PanelTarget) => {
    setMainDrawerState(false)
    clearSwitchTimer()
    switchPhaseRef.current = 'idle'

    if (target === 'queue' && queueState) {
      setQueueState(false)
      return
    }

    if (target === 'lyrics' && lyricsState) {
      setLyricsState(false)
      return
    }

    // If no panel is open yet, open immediately so slide-in animation stays snappy.
    if (!queueState && !lyricsState) {
      if (target === 'queue') {
        setQueueState(true)
      } else {
        setLyricsState(true)
      }
      return
    }

    // Close current panel first, then open target to avoid visual jumping.
    switchPhaseRef.current = 'closing_for_switch'
    setQueueState(false)
    setLyricsState(false)

    panelSwitchTimerRef.current = setTimeout(() => {
      if (switchPhaseRef.current !== 'closing_for_switch') return
      if (target === 'queue') {
        setQueueState(true)
      } else {
        setLyricsState(true)
      }
      switchPhaseRef.current = 'idle'
      panelSwitchTimerRef.current = null
    }, PANEL_SWITCH_DELAY_MS)
  }

  useEffect(() => {
    return () => clearSwitchTimer()
  }, [])

  const toggleQueueInFullscreen = () => {
    switchPanel('queue')
  }

  const toggleLyricsInFullscreen = () => {
    switchPanel('lyrics')
  }

  return (
    <div
      className={clsx(
        'relative w-full h-full flex flex-col justify-end transition-[padding] duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        isChromeVisible ? 'pb-[68px]' : 'pb-4',
      )}
    >
      <div
        className={clsx(
          'transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
          isChromeVisible
            ? 'mb-2.5 translate-y-0 opacity-100'
            : 'mb-0 translate-y-0 opacity-100',
        )}
      >
        <FullscreenProgress />
      </div>

      <div
        className={clsx(
          'absolute left-0 right-0 bottom-0 flex items-center justify-between gap-4 px-1 py-1 transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
          isChromeVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none',
        )}
      >
        <div
          className={clsx(
            'w-[200px] flex items-center gap-2 justify-start transition-all duration-300',
            !isChromeVisible && 'opacity-0 translate-y-2 pointer-events-none',
          )}
        >
          <CloseFullscreenButton />
          <FullscreenSettings />
        </div>

        <div
          className={clsx(
            'flex flex-1 justify-center items-center gap-2 transition-all duration-300',
            !isChromeVisible && 'opacity-0 translate-y-2 pointer-events-none',
          )}
        >
          <FullscreenControls />
        </div>

        <div
          className={clsx(
            'w-[304px] flex items-center gap-1.5 justify-end transition-all duration-300',
            !isChromeVisible && 'opacity-0 translate-y-2 pointer-events-none',
          )}
        >
          <div className="-ml-1">
            <LikeButton />
          </div>
          <SonaDjButton />
          <Button
            variant="ghost"
            size="icon"
            className={clsx(
              'rounded-md size-10 p-2 text-secondary-foreground relative hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
              lyricsState && 'player-button-active',
            )}
            onClick={toggleLyricsInFullscreen}
          >
            <MicVocalIcon
              className={clsx('w-4 h-4', lyricsState && 'text-primary')}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={clsx(
              'rounded-md size-10 p-2 text-secondary-foreground relative hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
              queueState && 'player-button-active',
            )}
            onClick={toggleQueueInFullscreen}
          >
            <ListVideo
              className={clsx('w-4 h-4', queueState && 'text-primary')}
            />
          </Button>
          <VolumeContainer />
        </div>
      </div>
    </div>
  )
}
