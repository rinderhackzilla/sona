import { clsx } from 'clsx'
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

export function FullscreenPlayer({ isChromeVisible }: FullscreenPlayerProps) {
  return (
    <div className="w-full">
      <FullscreenProgress />

      <div className="flex items-center justify-between gap-4 mt-5">
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
            'w-[200px] flex items-center gap-4 justify-end transition-all duration-300',
            !isChromeVisible && 'opacity-0 translate-y-2 pointer-events-none',
          )}
        >
          <SonaDjButton />
          <LikeButton />
          <VolumeContainer />
        </div>
      </div>
    </div>
  )
}
