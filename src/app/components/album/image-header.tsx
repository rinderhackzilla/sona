import clsx from 'clsx'
import { type SyntheticEvent, useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { getSimpleCoverArtUrl } from '@/api/httpClient'
import {
  AlbumArtistInfo,
  AlbumMultipleArtistsInfo,
} from '@/app/components/album/artists'
import { ImageHeaderEffect } from '@/app/components/album/header-effect'
import { AlbumHeaderFallback } from '@/app/components/fallbacks/album-fallbacks'
import { BadgesData, HeaderInfoGenerator } from '@/app/components/header-info'
import { ImageLoader } from '@/app/components/image-loader'
import { CustomLightBox } from '@/app/components/lightbox'
import { cn } from '@/lib/utils'
import { CoverArt } from '@/types/coverArtType'
import { IFeaturedArtist } from '@/types/responses/artist'
import { getTextSizeClass } from '@/utils/getTextSizeClass'

interface ImageHeaderProps {
  type: string
  title: string
  subtitle?: string
  artistId?: string
  artists?: IFeaturedArtist[]
  coverArtId?: string
  coverArtType: CoverArt
  coverArtSize: string
  coverArtAlt: string
  badges: BadgesData
  isPlaylist?: boolean
}

export default function ImageHeader({
  type,
  title,
  subtitle,
  artistId,
  artists,
  coverArtId,
  coverArtType,
  coverArtSize,
  coverArtAlt,
  badges,
  isPlaylist = false,
}: ImageHeaderProps) {
  const [open, setOpen] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(0.42)
  const fallbackCoverSrc = getSimpleCoverArtUrl(
    undefined,
    coverArtType,
    coverArtSize,
  )

  function calculateImageLuminance(image: HTMLImageElement) {
    try {
      const sampleSize = 24
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return null

      canvas.width = sampleSize
      canvas.height = sampleSize
      context.drawImage(image, 0, 0, sampleSize, sampleSize)
      const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data

      let weightedSum = 0
      let pixelCount = 0
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3] / 255
        if (alpha < 0.1) continue

        const red = pixels[i] / 255
        const green = pixels[i + 1] / 255
        const blue = pixels[i + 2] / 255
        const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
        weightedSum += luminance * alpha
        pixelCount += alpha
      }

      if (pixelCount === 0) return null
      return weightedSum / pixelCount
    } catch {
      return null
    }
  }

  function applyAdaptiveOverlayByLuminance(luminance: number | null) {
    if (luminance === null) {
      setOverlayOpacity(0.42)
      return
    }

    if (luminance >= 0.78) {
      setOverlayOpacity(0.68)
      return
    }
    if (luminance >= 0.62) {
      setOverlayOpacity(0.56)
      return
    }
    if (luminance >= 0.48) {
      setOverlayOpacity(0.48)
      return
    }
    setOverlayOpacity(0.38)
  }

  function getImage() {
    return document.getElementById('cover-art-image') as HTMLImageElement
  }

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    const img = getImage()
    if (!img) return

    img.crossOrigin = null
    setOverlayOpacity(0.46)

    const currentSrc = event.currentTarget.src ?? ''
    if (!currentSrc.includes('/default_') && fallbackCoverSrc) {
      event.currentTarget.src = fallbackCoverSrc
    }
  }

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const luminance = calculateImageLuminance(event.currentTarget)
    applyAdaptiveOverlayByLuminance(luminance)
  }

  const hasMultipleArtists = artists ? artists.length > 1 : false

  return (
    <ImageLoader id={coverArtId} type={coverArtType} size={coverArtSize}>
      {(src, isLoading) =>
        (() => {
          const resolvedDisplaySrc = src || fallbackCoverSrc
          const usesExternalUrl = /^https?:\/\//i.test(resolvedDisplaySrc)
          const shouldUseAnonymousCors = !usesExternalUrl
          return (
            <div
              className="flex relative w-full h-[calc(3rem+200px)] 2xl:h-[calc(3rem+250px)]"
              key={`header-${coverArtId}`}
            >
              {isLoading && (
                <div className="absolute inset-0 z-20">
                  <AlbumHeaderFallback />
                </div>
              )}

              {/* Blurred background image */}
              {!isLoading && src && (
                <div className="absolute inset-0 z-0 overflow-visible">
                  <img
                    src={resolvedDisplaySrc}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-[calc(100%+205px)] object-cover scale-125"
                    style={{
                      filter: 'blur(24px)',
                      WebkitMaskImage:
                        'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) calc(100% - 205px), rgba(0,0,0,0) 100%)',
                      maskImage:
                        'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) calc(100% - 205px), rgba(0,0,0,0) 100%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,var(--sona-header-overlay-mid)) 52%, rgba(0,0,0,0.22) 100%)',
                      // CSS custom prop keeps style readable and allows smooth updates.
                      ['--sona-header-overlay-mid' as string]:
                        overlayOpacity.toFixed(2),
                    }}
                  />
                </div>
              )}

              <div
                className={cn(
                  'w-full px-8 py-6 flex gap-4 absolute inset-0 z-10',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className={cn(
                    'w-[200px] h-[200px] min-w-[200px] min-h-[200px]',
                    '2xl:w-[250px] 2xl:h-[250px] 2xl:min-w-[250px] 2xl:min-h-[250px]',
                    'bg-skeleton aspect-square bg-cover bg-center rounded-[var(--radius-surface-lg)]',
                    'shadow-header-image overflow-hidden',
                    'transition-transform duration-150 ease-out hover:scale-[1.02]',
                    'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none',
                  )}
                >
                  <LazyLoadImage
                    key={coverArtId}
                    effect="opacity"
                    crossOrigin={
                      shouldUseAnonymousCors ? 'anonymous' : undefined
                    }
                    id="cover-art-image"
                    src={resolvedDisplaySrc}
                    alt={coverArtAlt}
                    className="aspect-square object-cover w-full h-full"
                    width="100%"
                    height="100%"
                    onError={handleError}
                    onLoad={handleImageLoad}
                  />
                </button>

                <div className="flex w-full max-w-[calc(100%-216px)] 2xl:max-w-[calc(100%-266px)] flex-col justify-end z-10">
                  <p className="text-sm text-muted-foreground text-shadow-md">
                    {type}
                  </p>
                  <h1
                    className={clsx(
                      'max-w-full scroll-m-20 font-bold tracking-tight antialiased text-shadow-md break-words line-clamp-2',
                      getTextSizeClass(title),
                    )}
                  >
                    {title}
                  </h1>

                  {!isPlaylist && artists && hasMultipleArtists && (
                    <div className="flex items-center mt-2">
                      <AlbumMultipleArtistsInfo artists={artists} />
                      <HeaderInfoGenerator badges={badges} />
                    </div>
                  )}

                  {!isPlaylist && subtitle && !hasMultipleArtists && (
                    <>
                      {artistId ? (
                        <div className="flex items-center mt-2">
                          <AlbumArtistInfo id={artistId} name={subtitle} />
                          <HeaderInfoGenerator badges={badges} />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-shadow-md">
                          {subtitle}
                        </p>
                      )}
                    </>
                  )}

                  {isPlaylist && subtitle && (
                    <>
                      <p className="text-sm text-muted-foreground text-shadow-md line-clamp-2 mt-1 mb-2">
                        {subtitle}
                      </p>
                      <HeaderInfoGenerator
                        badges={badges}
                        showFirstDot={false}
                      />
                    </>
                  )}

                  {!subtitle && (
                    <div className="mt-1">
                      <HeaderInfoGenerator
                        badges={badges}
                        showFirstDot={false}
                      />
                    </div>
                  )}
                </div>
              </div>

              {isLoading ? (
                <ImageHeaderEffect className="bg-muted-foreground" />
              ) : (
                <ImageHeaderEffect />
              )}

              <CustomLightBox
                open={open}
                close={setOpen}
                src={resolvedDisplaySrc}
                alt={coverArtAlt}
              />
            </div>
          )
        })()
      }
    </ImageLoader>
  )
}
