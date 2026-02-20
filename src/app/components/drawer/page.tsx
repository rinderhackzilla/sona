import clsx from 'clsx'
import { ChevronDownIcon } from 'lucide-react'
import { ComponentPropsWithoutRef, useMemo } from 'react'
import { getSimpleCoverArtUrl } from '@/api/httpClient'
import { LyricsTab } from '@/app/components/fullscreen/lyrics'
import { QueueSettings } from '@/app/components/fullscreen/settings'
import { CurrentSongInfo } from '@/app/components/queue/current-song-info'
import { QueueSongList } from '@/app/components/queue/song-list'
import { Button } from '@/app/components/ui/button'
import { Drawer, DrawerContent } from '@/app/components/ui/drawer'
import { cn } from '@/lib/utils'
import {
  useLyricsState,
  useMainDrawerState,
  usePlayerCurrentSong,
  useQueueState,
  useSongColor,
} from '@/store/player.store'
import { hexToRgba } from '@/utils/getAverageColor'

export function MainDrawerPage() {
  const { currentSongColor, useSongColorOnQueue, currentSongColorIntensity, bigPlayerBlur } =
    useSongColor()
  const { mainDrawerState, closeDrawer } = useMainDrawerState()
  const { queueState } = useQueueState()
  const { lyricsState } = useLyricsState()
  const { coverArt } = usePlayerCurrentSong()
  const coverArtUrl = getSimpleCoverArtUrl(coverArt, 'song', '300')

  const backgroundColor = useMemo(() => {
    if (!useSongColorOnQueue || !currentSongColor) return undefined

    return hexToRgba(currentSongColor, currentSongColorIntensity)
  }, [currentSongColor, useSongColorOnQueue, currentSongColorIntensity])

  return (
    <Drawer
      open={mainDrawerState}
      onClose={closeDrawer}
      fixed={true}
      handleOnly={true}
      disablePreventScroll={true}
      dismissible={true}
      modal={false}
    >
      <DrawerContent
        className="main-drawer rounded-t-none border-none select-none cursor-default outline-none"
        showHandle={false}
        aria-describedby={undefined}
      >
        {/* Background layer - same as fullscreen */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <div className="relative w-full h-full transition-colors duration-1000 bg-black/0">
            {/* Blurred background image */}
            <div
              className="absolute -inset-10 bg-cover bg-center z-0 transition-[background-image,filter] duration-1000"
              style={{
                backgroundImage: `url(${coverArtUrl})`,
                filter: `blur(${bigPlayerBlur.value}px)`,
              }}
            />
            {/* Animated gradient overlay */}
            <div 
              className="absolute inset-0 w-full h-full z-[1] opacity-30 animate-gradient-shift"
              style={{
                background: 'linear-gradient(45deg, hsl(var(--background)), hsl(var(--accent)), hsl(var(--primary)), hsl(var(--background)))',
                backgroundSize: '400% 400%',
              }}
            />
            {/* Base overlay */}
            <div className="bg-background/50 absolute inset-0 w-full h-full z-[2] transition-colors duration-1000" />
          </div>
        </div>

        {/* Content layer */}
        <div
          className={clsx(
            'relative z-10 flex flex-col w-full h-content',
            'transition-[background-color] duration-1000',
          )}
          style={{ backgroundColor: queueState && backgroundColor ? backgroundColor : undefined }}
        >
          <div className="flex w-full h-14 min-h-14 px-[6%] items-center justify-end gap-2">
            <QueueSettings />
            <Button
              variant="ghost"
              className="w-10 h-10 rounded-full p-0 hover:bg-foreground/20"
              onClick={closeDrawer}
            >
              <ChevronDownIcon />
            </Button>
          </div>
          <div className="flex w-full h-full mt-8 px-[6%] mb-0">
            {/* Show CurrentSongInfo only for Queue */}
            {queueState && <CurrentSongInfo />}

            <div className="flex flex-1 justify-center relative">
              <ActiveContent active={queueState}>
                <QueueSongList />
              </ActiveContent>
              <ActiveContent active={lyricsState}>
                <LyricsTab />
              </ActiveContent>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

type ActiveContentProps = ComponentPropsWithoutRef<'div'> & {
  active: boolean
}

function ActiveContent({
  active,
  children,
  className,
  ...props
}: ActiveContentProps) {
  return (
    <div
      className={cn(
        'w-full h-full absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-300 bg-black/0',
        active && 'opacity-100 pointer-events-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
