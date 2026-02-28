import clsx from 'clsx'
import { useState } from 'react'
import { ImageLoader } from '@/app/components/image-loader'
import { VISUALIZERS } from '@/app/components/fullscreen/visualizers'
import { useVisualizerContext } from '@/app/components/fullscreen/settings'
import { usePlayerStore } from '@/store/player.store'

interface FullscreenSongImageProps {
  isChromeVisible: boolean
}

export function FullscreenSongImage({ isChromeVisible }: FullscreenSongImageProps) {
  const { coverArt, artist, title } = usePlayerStore(({ songlist }) => {
    return songlist.currentSong
  })

  const [showVisualizer, setShowVisualizer] = useState(false)
  const { preset } = useVisualizerContext()

  const handleClick = () => {
    setShowVisualizer(!showVisualizer)
  }

  const VisualizerComponent = VISUALIZERS[preset]

  return (
    // Height-driven square: height is constrained by the available row height,
    // width follows via aspect-square. Never overflows its container.
    <div
      className={clsx(
        'h-full aspect-square flex-shrink-0 min-h-0 flex items-center justify-center',
        !showVisualizer && 'transition-all duration-500 ease-in-out',
        showVisualizer
          ? 'max-h-[520px] 2xl:max-h-[640px]'
          : isChromeVisible
            ? 'max-h-[520px] 2xl:max-h-[640px]'
            : 'max-h-[595px] 2xl:max-h-[720px]',
      )}
    >
      <div
        className={clsx(
          'relative w-full h-full rounded-lg 2xl:rounded-2xl overflow-hidden cursor-pointer',
          !showVisualizer && 'bg-primary/10',
        )}
        onClick={handleClick}
      >
        {!showVisualizer ? (
          <ImageLoader id={coverArt} type="song" size={800}>
            {(src, isLoading) => (
              <img
                src={src}
                alt={`${artist} - ${title}`}
                className={clsx(
                  'absolute inset-0 w-full h-full object-cover shadow-custom-5 transition-opacity duration-300 opacity-0',
                  !isLoading && 'opacity-100',
                )}
              />
            )}
          </ImageLoader>
        ) : (
          <VisualizerComponent />
        )}
      </div>
    </div>
  )
}
