import clsx from 'clsx'
import { useState } from 'react'
import { ImageLoader } from '@/app/components/image-loader'
import { AspectRatio } from '@/app/components/ui/aspect-ratio'
import { VISUALIZERS } from '@/app/components/fullscreen/visualizers'
import { useVisualizerContext } from '@/app/components/fullscreen/settings'
import { usePlayerStore } from '@/store/player.store'

export function FullscreenSongImage() {
  const { coverArt, artist, title } = usePlayerStore(({ songlist }) => {
    return songlist.currentSong
  })

  const [showVisualizer, setShowVisualizer] = useState(false)
  const { preset } = useVisualizerContext()

  const handleClick = () => {
    setShowVisualizer(!showVisualizer)
  }

  // Get the current visualizer component
  const VisualizerComponent = VISUALIZERS[preset]

  return (
    <div className="2xl:w-[33%] h-full max-w-[450px] max-h-[450px] 2xl:max-w-[550px] 2xl:max-h-[550px] items-end flex aspect-square">
      <AspectRatio
        ratio={1 / 1}
        className="rounded-lg 2xl:rounded-2xl overflow-hidden bg-accent/60 cursor-pointer relative"
        onClick={handleClick}
      >
        {!showVisualizer ? (
          <ImageLoader id={coverArt} type="song" size={800}>
            {(src, isLoading) => (
              <img
                src={src}
                alt={`${artist} - ${title}`}
                className={clsx(
                  'aspect-square object-cover shadow-custom-5 transition-opacity duration-300 opacity-0',
                  'relative after:absolute after:block after:inset-0 after:bg-accent after:text-transparent',
                  !isLoading && 'opacity-100',
                )}
                width="100%"
                height="100%"
              />
            )}
          </ImageLoader>
        ) : (
          <div className="w-full h-full relative">
            <VisualizerComponent />
          </div>
        )}
      </AspectRatio>
    </div>
  )
}
