import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { isSafari } from 'react-device-detect'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { getSimpleCoverArtUrl } from '@/api/httpClient'
import { ImageLoader } from '@/app/components/image-loader'
import { useVisualizerContext } from '@/app/components/fullscreen/settings'
import { usePlayerCurrentSong, useSongColor } from '@/store/player.store'
import { isChromeOrFirefox } from '@/utils/browser'
import { hexToRgba } from '@/utils/getAverageColor'

export function FullscreenBackdrop() {
  const { useSongColorOnBigPlayer } = useSongColor()
  const { hypnoticBackdropEnabled } = useVisualizerContext()

  return (
    <>
      {useSongColorOnBigPlayer ? <DynamicColorBackdrop /> : <ImageBackdrop />}
      {hypnoticBackdropEnabled && <HypnoticMotionLayer />}
    </>
  )
}

export function ImageBackdrop() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
      {isSafari ? <MacBackdrop /> : <OtherBackdrop />}
    </div>
  )
}

function OtherBackdrop() {
  const { coverArt } = usePlayerCurrentSong()
  const coverArtUrl = getSimpleCoverArtUrl(coverArt, 'song', '300')
  const [backgroundImage, setBackgroundImage] = useState(coverArtUrl)
  const { bigPlayerBlur } = useSongColor()

  const newBackgroundImage = useMemo(() => coverArtUrl, [coverArtUrl])

  useEffect(() => {
    const img = new Image()
    img.src = newBackgroundImage
    img.onload = () => {
      setBackgroundImage(newBackgroundImage)
    }
  }, [newBackgroundImage])

  return (
    <div className="relative w-full h-full transition-colors duration-1000 bg-black/0">
      <div
        className="absolute -inset-10 bg-cover bg-center z-0 transition-[background-image,filter] duration-1000 fullscreen-bg-kenburns"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: `blur(${bigPlayerBlur.value}px)`,
        }}
      />
      <div className="absolute inset-0 w-full h-full z-[1] bg-black/10" />
      <div className="absolute inset-0 w-full h-full z-[2] bg-primary/10 transition-colors duration-1000" />
      <div className="bg-background/45 absolute inset-0 w-full h-full z-[3] transition-colors duration-1000" />
    </div>
  )
}

function MacBackdrop() {
  const { coverArt, title } = usePlayerCurrentSong()
  const { bigPlayerBlur } = useSongColor()
  const { currentSongColor, currentSongColorIntensity } = useSongColor()

  const backgroundColor = useMemo(() => {
    if (!currentSongColor) return undefined

    return hexToRgba(currentSongColor, currentSongColorIntensity)
  }, [currentSongColor, currentSongColorIntensity])

  return (
    <div
      className="relative w-full h-full flex items-center transition-colors duration-1000"
      style={{ backgroundColor }}
    >
      <ImageLoader id={coverArt} type="song">
        {(src) => (
          <LazyLoadImage
            key={coverArt}
            src={src}
            alt={title}
            effect="opacity"
            width="100%"
            className="w-full bg-contain fullscreen-bg-kenburns"
          />
        )}
      </ImageLoader>
      <div className="absolute inset-0 z-[9] bg-black/10" />
      <div className="absolute inset-0 z-[9] bg-primary/10 transition-colors duration-1000" />
      <div
        className="absolute bg-background/45 inset-0 z-10 transition-all duration-1000"
        style={{
          WebkitBackdropFilter: `blur(${bigPlayerBlur.value}px)`,
          backdropFilter: `blur(${bigPlayerBlur.value}px)`,
        }}
      />
    </div>
  )
}

function DynamicColorBackdrop() {
  const { coverArt } = usePlayerCurrentSong()
  const coverArtUrl = getSimpleCoverArtUrl(coverArt, 'song', '300')
  const [backgroundImage, setBackgroundImage] = useState(coverArtUrl)
  const { currentSongColorIntensity, bigPlayerBlur } = useSongColor()

  const newBackgroundImage = useMemo(() => coverArtUrl, [coverArtUrl])

  useEffect(() => {
    const img = new Image()
    img.src = newBackgroundImage
    img.onload = () => {
      setBackgroundImage(newBackgroundImage)
    }
  }, [newBackgroundImage])

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
      <div
        className={clsx(
          'relative w-full h-full',
          isChromeOrFirefox && 'bg-black/0',
        )}
      >
        {/* Blurred background image */}
        <div
          className="absolute -inset-10 bg-cover bg-center z-0 transition-[background-image,filter] duration-1000 fullscreen-bg-kenburns"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            filter: `blur(${bigPlayerBlur.value}px)`,
          }}
        />
        
        {/* Color overlay using theme colors - slider controls opacity */}
        <div 
          className="absolute inset-0 w-full h-full z-[1] transition-opacity duration-1000"
          style={{ 
            backgroundColor: 'hsl(var(--primary))',
            opacity: Math.min(currentSongColorIntensity * 0.26, 0.2),
          }}
        />
        
        <div className="absolute inset-0 w-full h-full z-[2] bg-black/10" />
        
        {/* Gradient overlay */}
        <div
          className={clsx(
            'absolute inset-0 w-full h-full z-[3]',
            'transition-[background-image] duration-1000 default-gradient',
          )}
        />
      </div>
    </div>
  )
}

function HypnoticMotionLayer() {
  return (
    <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none">
      <div className="hypnotic-layer-a" />
      <div className="hypnotic-layer-b" />
      <div className="hypnotic-layer-c" />
    </div>
  )
}
