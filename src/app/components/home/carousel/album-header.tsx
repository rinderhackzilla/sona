import Autoplay from 'embla-carousel-autoplay'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ImageLoader } from '@/app/components/image-loader'
import { OnRepeatItem } from '@/app/components/home/carousel/on-repeat-item'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/app/components/ui/carousel'
import { Button } from '@/app/components/ui/button'
import { ROUTES } from '@/routes/routesList'
import { Albums } from '@/types/responses/album'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { useOnRepeat } from '@/app/hooks/use-on-repeat'
import { cn } from '@/lib/utils'

interface AlbumHeaderProps {
  albums: Albums[]
  title?: string
  subtitle?: string
}

function AlbumHeaderItem({ album }: { album: Albums }) {
  const { t } = useTranslation()
  const { setSongList } = usePlayerActions()
  const [imageLoaded, setImageLoaded] = useState(false)

  async function handlePlayAlbum() {
    const response = await subsonic.albums.getOne(album.id)
    if (response) {
      setSongList(response.song, 0)
    }
  }

  return (
    <div className="relative h-[222px] w-full overflow-hidden sm:h-[252px] 2xl:h-[278px]">
      {/* Background Image with Blur */}
      <ImageLoader id={album.coverArt} type="album">
        {(src) => (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-45"
              style={{ backgroundImage: `url(${src})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/88 via-background/46 to-background/20" />
          </>
        )}
      </ImageLoader>

      {/* Content */}
      <div className="relative z-10 grid h-full grid-cols-[minmax(0,1fr),auto] items-center gap-5 px-5 sm:gap-8 sm:px-7">
        {/* Album Info */}
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-xs text-muted-foreground sm:text-sm">
              {t('home.recommendedAlbum')}
            </p>
            <Link
              to={ROUTES.ALBUM.PAGE(album.id)}
              className="hover:underline"
            >
              <h2 className="truncate text-[1.65rem] font-bold leading-tight sm:text-[2rem] xl:text-[2.5rem] 2xl:text-[2.95rem]">
                {album.name}
              </h2>
            </Link>
            <Link
              to={ROUTES.ARTIST.PAGE(album.artistId || '')}
              className="inline-block text-base text-muted-foreground hover:text-primary hover:underline sm:text-lg"
            >
              {album.artist}
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="inline-flex items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-sm text-foreground/80 backdrop-blur-sm">
              {album.genre && (
                <span>{album.genre}</span>
              )}
              {album.genre && (album.year || album.songCount) && (
                <span className="text-foreground/40">•</span>
              )}
              {album.year && (
                <span>{album.year}</span>
              )}
              {album.year && album.songCount && (
                <span className="text-foreground/40">•</span>
              )}
              {album.songCount && (
                <span>{t('playlist.songCount', { count: album.songCount })}</span>
              )}
            </div>
          </div>

          <Button
            onClick={handlePlayAlbum}
            className="w-fit gap-2 border border-primary/30 bg-primary/90 hover:bg-primary"
            size="sm"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            {t('options.play')}
          </Button>
        </div>

        {/* Album Cover */}
        <Link
          to={ROUTES.ALBUM.PAGE(album.id)}
          className="group relative flex-shrink-0"
        >
          <ImageLoader id={album.coverArt} type="album">
            {(src) => (
              <img
                src={src}
                alt={album.name}
                className={cn(
                  'h-[176px] w-[176px] rounded-xl border border-border/50 object-cover shadow-2xl transition-all duration-300 group-hover:scale-[1.025] sm:h-[202px] sm:w-[202px] 2xl:h-[228px] 2xl:w-[228px]',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                )}
                onLoad={() => setImageLoaded(true)}
              />
            )}
          </ImageLoader>
        </Link>
      </div>
    </div>
  )
}

export default function AlbumHeader({
  albums,
  title,
  subtitle,
}: AlbumHeaderProps) {
  const [_api, setApi] = useState<CarouselApi>()
  const { data: onRepeat, isLoading: onRepeatLoading } = useOnRepeat()

  // Combine On Repeat with albums
  const carouselItems = []
  
  // Add On Repeat as first item if available
  if (onRepeat?.song) {
    carouselItems.push({
      type: 'onRepeat' as const,
      data: onRepeat,
    })
  }

  // Add regular albums
  albums.forEach((album) => {
    carouselItems.push({
      type: 'album' as const,
      data: album,
    })
  })

  if (carouselItems.length === 0 && !onRepeatLoading) return null

  return (
    <div>
      {title && (
        <div className="mb-4">
          <h2 className="text-3xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      )}

      <Carousel
        className="w-full overflow-hidden rounded-xl border border-border/60 bg-card/20"
        opts={{
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 8000,
          }),
        ]}
        setApi={setApi}
      >
        <CarouselContent
          className="ml-0 transform-gpu"
          style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
        >
          {carouselItems.map((item, index) => (
            <CarouselItem
              key={item.type === 'onRepeat' ? 'on-repeat' : item.data.id}
              className="pl-0 basis-full maskImage-carousel-item"
            >
              {item.type === 'onRepeat' ? (
                <OnRepeatItem
                  song={item.data.song}
                  playcount={item.data.playcount}
                />
              ) : (
                <AlbumHeaderItem album={item.data} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
