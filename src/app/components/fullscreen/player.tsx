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
    <div
      className={clsx(
        'relative w-full h-full flex flex-col justify-end transition-[padding] duration-500 ease-in-out',
        isChromeVisible ? 'pb-[68px]' : 'pb-4',
      )}
    >
      <div
        className={clsx(
          'transition-all duration-500 ease-in-out',
          isChromeVisible ? 'mb-2.5 translate-y-0 opacity-100' : 'mb-0 translate-y-0 opacity-100',
        )}
      >
        <FullscreenProgress />
      </div>

      <div
        className={clsx(
          'absolute left-0 right-0 bottom-0 flex items-center justify-between gap-4 px-1 py-1 transition-all duration-500 ease-in-out',
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
