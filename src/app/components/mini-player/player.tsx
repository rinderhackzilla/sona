import clsx from 'clsx'
import { memo } from 'react'
import { ResizeHandler } from '@/app/components/icons/resize-handler'
import { useSongColor } from '@/store/player.store'
import { MiniPlayerControls, MiniPlayerLikeButton } from './controls'
import { MiniPlayerProgress } from './progress'
import { MiniPlayerSongImage } from './song-image'
import { MiniPlayerSongTitle } from './song-title'
import { MiniPlayerVolume } from './volume'

const MemoMiniPlayerControls = memo(MiniPlayerControls)
const MemoMiniPlayerLikeButton = memo(MiniPlayerLikeButton)
const MemoMiniPlayerProgress = memo(MiniPlayerProgress)
const MemoMiniPlayerSongImage = memo(MiniPlayerSongImage)
const MemoMiniPlayerSongTitle = memo(MiniPlayerSongTitle)
const MemoMiniPlayerVolume = memo(MiniPlayerVolume)

export function MiniPlayer() {
  const { currentSongColor } = useSongColor()

  return (
    <div className="w-screen h-screen max-h-screen grid grid-rows-1 [@media(min-height:133px)_and_(max-height:170px)]:grid-rows-floating-player gap-2 [@media(min-height:133px)_and_(max-height:170px)]:gap-1 p-1 [@media(min-height:133px)_and_(max-height:170px)]:p-2 [@media(max-height:132px)]:p-1.5 pb-4 [@media(min-height:133px)_and_(max-height:170px)]:pb-4 relative">
      <div
        className={clsx(
          'w-full h-full gap-2 grid grid-rows-floating-player',
          '[@media(min-height:133px)_and_(max-height:170px)]:grid-rows-1 [@media(min-height:133px)_and_(max-height:170px)]:grid-cols-mid-player-info [@media(min-height:133px)_and_(max-height:170px)]:items-center',
          '[@media(max-height:132px)]:grid-rows-1 [@media(max-height:132px)]:grid-cols-mini-player [@media(max-height:132px)]:items-center',
        )}
      >
        <div
          className={clsx(
            'w-full h-full [@media(min-height:133px)_and_(max-height:170px)]:aspect-square [@media(max-height:132px)]:aspect-square',
            'flex flex-col items-center justify-center gap-2',
            'default-gradient rounded-md [@media(max-height:132px)]:rounded',
            'transition-[background-image,background-color] duration-1000 overflow-hidden',
            '[@media(min-height:133px)_and_(max-height:170px)]:!bg-transparent [@media(min-height:133px)_and_(max-height:170px)]:from-transparent [@media(min-height:133px)_and_(max-height:170px)]:to-transparent',
            '[@media(max-height:132px)]:!bg-transparent [@media(max-height:132px)]:from-transparent [@media(max-height:132px)]:to-transparent',
          )}
          style={{ backgroundColor: currentSongColor ?? undefined }}
        >
          <div
            className={clsx(
              'flex w-full h-full relative p-3 justify-center items-center group bg-transparent',
              '[@media(min-height:133px)_and_(max-height:170px)]:min-h-fit [@media(min-height:133px)_and_(max-height:170px)]:max-h-full [@media(min-height:133px)_and_(max-height:170px)]:p-0 [@media(min-height:133px)_and_(max-height:170px)]:aspect-square',
              '[@media(max-height:132px)]:min-h-fit [@media(max-height:132px)]:max-h-full [@media(max-height:132px)]:p-0 [@media(max-height:132px)]:aspect-square',
            )}
          >
            <MemoMiniPlayerSongImage />
            <div
              className={clsx(
                'flex flex-col w-full gap-4 absolute inset-0',
                'bg-gradient-to-b from-background/70 via-background/50 via-50% to-background to-90%',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-300',
                '[@media(min-height:133px)_and_(max-height:170px)]:hidden [@media(max-height:132px)]:hidden',
              )}
            >
              <div className="flex flex-col flex-1 px-2 justify-center items-center absolute inset-0">
                <MemoMiniPlayerControls />
              </div>
              <div className="mb-auto px-2 pt-0.5">
                <MemoMiniPlayerVolume />
              </div>
              <div className="mt-auto px-2 pb-0.5">
                <MemoMiniPlayerProgress />
              </div>
            </div>
          </div>
        </div>
        <div
          className={clsx(
            'min-w-12 h-12 flex items-center justify-between pb-2 pl-1 [@media(max-height:132px)]:h-10',
            '[@media(min-height:133px)_and_(max-height:170px)]:pl-0 [@media(max-height:132px)]:pl-0 [@media(min-height:133px)_and_(max-height:170px)]:pb-0 [@media(max-height:132px)]:pb-0.5 [@media(min-height:133px)_and_(max-height:170px)]:flex-1',
          )}
        >
          <MemoMiniPlayerSongTitle />
          <MemoMiniPlayerLikeButton />
        </div>
        <div className="hidden [@media(max-height:132px)]:flex">
          <MemoMiniPlayerControls />
        </div>
      </div>
      <div className="hidden [@media(min-height:133px)_and_(max-height:170px)]:flex justify-center items-center h-10 max-h-10">
        <MemoMiniPlayerControls />
      </div>
      <ResizeHandler className="absolute w-5 h-5 bottom-0 right-0 text-foreground/50" />
    </div>
  )
}
