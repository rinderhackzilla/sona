import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { isSafari } from 'react-device-detect'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { getSimpleCoverArtUrl } from '@/api/httpClient'
import { useVisualizerContext } from '@/app/components/fullscreen/settings'
import { ImageLoader } from '@/app/components/image-loader'
import { useReducedMotion } from '@/app/hooks/use-reduced-motion'
import {
  usePlayerCurrentSong,
  useSessionModeSettings,
  useSongColor,
} from '@/store/player.store'
import { isChromeOrFirefox } from '@/utils/browser'
import { hexToRgba } from '@/utils/getAverageColor'

function getImageLuminanceFromElement(image: HTMLImageElement) {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null

    const size = 24
    canvas.width = size
    canvas.height = size
    context.drawImage(image, 0, 0, size, size)
    const data = context.getImageData(0, 0, size, size).data

    let sum = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255
      if (alpha < 0.1) continue
      const red = data[i] / 255
      const green = data[i + 1] / 255
      const blue = data[i + 2] / 255
      sum += (0.2126 * red + 0.7152 * green + 0.0722 * blue) * alpha
      count += alpha
    }

    if (count === 0) return null
    return sum / count
  } catch {
    return null
  }
}

function getAdaptiveDimOverlay(
  luminance: number | null,
  mode: 'off' | 'focus' | 'night',
) {
  let opacity = 0.12
  if (luminance !== null) {
    if (luminance >= 0.78) opacity = 0.36
    else if (luminance >= 0.62) opacity = 0.28
    else if (luminance >= 0.48) opacity = 0.2
  }

  if (mode === 'focus') opacity += 0.12
  if (mode === 'night') opacity += 0.06
  return Math.min(0.62, Math.max(0.1, opacity))
}

function useBackdropLuminance(coverUrl: string) {
  const [luminance, setLuminance] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = coverUrl
    image.onload = () => {
      if (cancelled) return
      setLuminance(getImageLuminanceFromElement(image))
    }
    image.onerror = () => {
      if (cancelled) return
      setLuminance(null)
    }

    return () => {
      cancelled = true
    }
  }, [coverUrl])

  return luminance
}

export function FullscreenBackdrop() {
  const { useSongColorOnBigPlayer } = useSongColor()
  const { hypnoticBackdropEnabled } = useVisualizerContext()
  const reduceMotion = useReducedMotion()

  return (
    <>
      {useSongColorOnBigPlayer ? <DynamicColorBackdrop /> : <ImageBackdrop />}
      {hypnoticBackdropEnabled && !reduceMotion && <HypnoticMotionLayer />}
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
  const { mode } = useSessionModeSettings()
  const coverArtUrl = getSimpleCoverArtUrl(coverArt, 'song', '300')
  const luminance = useBackdropLuminance(coverArtUrl)
  const [backgroundImage, setBackgroundImage] = useState(coverArtUrl)
  const { bigPlayerBlur } = useSongColor()
  const reduceMotion = useReducedMotion()

  const newBackgroundImage = useMemo(() => coverArtUrl, [coverArtUrl])

  useEffect(() => {
    const img = new Image()
    img.src = newBackgroundImage
    img.onload = () => {
      setBackgroundImage(newBackgroundImage)
    }
  }, [newBackgroundImage])

  const modeFilter =
    mode === 'focus'
      ? 'saturate(0.25) brightness(0.45) contrast(1.04)'
      : mode === 'night'
        ? 'saturate(1.22) brightness(0.6) contrast(1.1)'
        : 'saturate(1) brightness(1)'
  const adaptiveDimOpacity = getAdaptiveDimOverlay(luminance, mode)

  return (
    <div className="relative w-full h-full transition-colors duration-1000 bg-black/0">
      <div
        className={clsx(
          'absolute -inset-10 bg-cover bg-center z-0 transition-[background-image,filter] duration-1000',
          !reduceMotion && 'fullscreen-bg-kenburns',
        )}
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: `blur(${bigPlayerBlur.value}px) ${modeFilter}`,
        }}
      />
      <div
        className="absolute inset-0 w-full h-full z-[1]"
        style={{ backgroundColor: `rgba(0,0,0,${adaptiveDimOpacity})` }}
      />
      <div
        className="absolute inset-0 w-full h-full z-[2] transition-colors duration-1000"
        style={{
          backgroundColor:
            mode === 'focus'
              ? 'hsl(var(--primary) / 0.04)'
              : mode === 'night'
                ? 'hsl(var(--primary) / 0.16)'
                : 'hsl(var(--primary) / 0.1)',
        }}
      />
      <div
        className="absolute inset-0 w-full h-full z-[3] transition-colors duration-1000"
        style={{
          backgroundColor:
            mode === 'focus'
              ? 'hsl(var(--background) / 0.72)'
              : mode === 'night'
                ? 'hsl(var(--background) / 0.56)'
                : 'hsl(var(--background) / 0.45)',
        }}
      />
    </div>
  )
}

function MacBackdrop() {
  const { coverArt, title } = usePlayerCurrentSong()
  const { mode } = useSessionModeSettings()
  const coverArtUrl = getSimpleCoverArtUrl(coverArt, 'song', '300')
  const luminance = useBackdropLuminance(coverArtUrl)
  const { bigPlayerBlur } = useSongColor()
  const { currentSongColor, currentSongColorIntensity } = useSongColor()
  const reduceMotion = useReducedMotion()

  const backgroundColor = useMemo(() => {
    if (!currentSongColor) return undefined

    return hexToRgba(currentSongColor, currentSongColorIntensity)
  }, [currentSongColor, currentSongColorIntensity])

  const modeFilter =
    mode === 'focus'
      ? 'saturate(0.24) brightness(0.45) contrast(1.04)'
      : mode === 'night'
        ? 'saturate(1.2) brightness(0.58) contrast(1.1)'
        : 'saturate(1) brightness(1)'
  const adaptiveDimOpacity = getAdaptiveDimOverlay(luminance, mode)

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
            className={clsx(
              'w-full bg-contain',
              !reduceMotion && 'fullscreen-bg-kenburns',
            )}
            style={{ filter: modeFilter }}
          />
        )}
      </ImageLoader>
      <div
        className="absolute inset-0 z-[9]"
        style={{ backgroundColor: `rgba(0,0,0,${adaptiveDimOpacity})` }}
      />
      <div
        className="absolute inset-0 z-[9] transition-colors duration-1000"
        style={{
          backgroundColor:
            mode === 'focus'
              ? 'hsl(var(--primary) / 0.04)'
              : mode === 'night'
                ? 'hsl(var(--primary) / 0.16)'
                : 'hsl(var(--primary) / 0.1)',
        }}
      />
      <div
        className="absolute inset-0 z-10 transition-all duration-1000"
        style={{
          backgroundColor:
            mode === 'focus'
              ? 'hsl(var(--background) / 0.72)'
              : mode === 'night'
                ? 'hsl(var(--background) / 0.56)'
                : 'hsl(var(--background) / 0.45)',
          WebkitBackdropFilter: `blur(${bigPlayerBlur.value}px)`,
          backdropFilter: `blur(${bigPlayerBlur.value}px)`,
        }}
      />
    </div>
  )
}

function DynamicColorBackdrop() {
  const { coverArt } = usePlayerCurrentSong()
  const { mode } = useSessionModeSettings()
  const coverArtUrl = getSimpleCoverArtUrl(coverArt, 'song', '300')
  const luminance = useBackdropLuminance(coverArtUrl)
  const [backgroundImage, setBackgroundImage] = useState(coverArtUrl)
  const { currentSongColorIntensity, bigPlayerBlur } = useSongColor()
  const reduceMotion = useReducedMotion()

  const newBackgroundImage = useMemo(() => coverArtUrl, [coverArtUrl])

  useEffect(() => {
    const img = new Image()
    img.src = newBackgroundImage
    img.onload = () => {
      setBackgroundImage(newBackgroundImage)
    }
  }, [newBackgroundImage])

  const modeFilter =
    mode === 'focus'
      ? 'saturate(0.24) brightness(0.45) contrast(1.04)'
      : mode === 'night'
        ? 'saturate(1.24) brightness(0.6) contrast(1.1)'
        : 'saturate(1) brightness(1)'
  const adaptiveDimOpacity = getAdaptiveDimOverlay(luminance, mode)

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
          className={clsx(
            'absolute -inset-10 bg-cover bg-center z-0 transition-[background-image,filter] duration-1000',
            !reduceMotion && 'fullscreen-bg-kenburns',
          )}
          style={{
            backgroundImage: `url(${backgroundImage})`,
            filter: `blur(${bigPlayerBlur.value}px) ${modeFilter}`,
          }}
        />

        {/* Color overlay using theme colors - slider controls opacity */}
        <div
          className="absolute inset-0 w-full h-full z-[1] transition-opacity duration-1000"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            opacity:
              mode === 'focus'
                ? Math.min(currentSongColorIntensity * 0.08, 0.07)
                : mode === 'night'
                  ? Math.min(currentSongColorIntensity * 0.34, 0.28)
                  : Math.min(currentSongColorIntensity * 0.26, 0.2),
          }}
        />

        <div
          className="absolute inset-0 w-full h-full z-[2]"
          style={{ backgroundColor: `rgba(0,0,0,${adaptiveDimOpacity})` }}
        />

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
