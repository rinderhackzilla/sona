import Autoplay from 'embla-carousel-autoplay'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { ImageLoader } from '@/app/components/image-loader'
import { OnRepeatItem } from '@/app/components/home/carousel/on-repeat-item'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
  const { setSongList } = usePlayerActions()
  const [imageLoaded, setImageLoaded] = useState(false)

  async function handlePlayAlbum() {
    const response = await subsonic.albums.getOne(album.id)
    if (response) {
      setSongList(response.song, 0)
    }
  }

  return (
    <div className="relative w-full h-[250px] 2xl:h-[300px] overflow-hidden">
      {/* Background Image with Blur */}
      <ImageLoader id={album.coverArt} type="album">
        {(src) => (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40"
              style={{ backgroundImage: `url(${src})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/80" />
          </>
        )}
      </ImageLoader>

      {/* Content */}
      <div className="relative h-full flex items-center gap-6 px-8 z-10">
        {/* Album Cover */}
        <Link
          to={ROUTES.ALBUM.PAGE(album.id)}
          className="flex-shrink-0 group relative"
        >
          <ImageLoader id={album.coverArt} type="album">
            {(src) => (
              <img
                src={src}
                alt={album.name}
                className={cn(
                  'w-[180px] h-[180px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl object-cover transition-all duration-300 group-hover:scale-105',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
              />
            )}
          </ImageLoader>
        </Link>

        {/* Album Info */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Recommended Album
            </p>
            <Link
              to={ROUTES.ALBUM.PAGE(album.id)}
              className="hover:underline"
            >
              <h2 className="text-4xl 2xl:text-5xl font-bold truncate">
                {album.name}
              </h2>
            </Link>
            <Link
              to={ROUTES.ARTIST.PAGE(album.artistId || '')}
              className="text-xl text-muted-foreground hover:text-primary hover:underline inline-block mt-1"
            >
              {album.artist}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {album.genre && (
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">
                {album.genre}
              </span>
            )}
            {album.year && (
              <span className="px-3 py-1 text-xs rounded-full bg-muted">
                {album.year}
              </span>
            )}
            {album.songCount && (
              <span className="text-sm text-muted-foreground">
                {album.songCount} {album.songCount === 1 ? 'song' : 'songs'}
              </span>
            )}
          </div>

          <Button
            onClick={handlePlayAlbum}
            className="w-fit gap-2"
            size="lg"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Play Album
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AlbumHeader({
  albums,
  title,
  subtitle,
}: AlbumHeaderProps) {
  const [api, setApi] = useState<CarouselApi>()
  const { data: onRepeat, isLoading: onRepeatLoading, error: onRepeatError } = useOnRepeat()

  // Debug logging
  useEffect(() => {
    console.log('[AlbumHeader] On Repeat Status:', {
      isLoading: onRepeatLoading,
      hasData: !!onRepeat,
      hasSong: !!onRepeat?.song,
      error: onRepeatError,
      data: onRepeat,
    })
  }, [onRepeat, onRepeatLoading, onRepeatError])

  // Combine On Repeat with albums
  const carouselItems = []
  
  // Add On Repeat as first item if available
  if (onRepeat?.song) {
    console.log('[AlbumHeader] Adding On Repeat to carousel:', onRepeat)
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

  console.log('[AlbumHeader] Total carousel items:', carouselItems.length, carouselItems)

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
        className="w-full border rounded-lg overflow-hidden"
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
          className="ml-0 flex transform-gpu"
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
        <div className="absolute right-[4.5rem] bottom-10">
          <CarouselPrevious className="-left-6 shadow-sm" />
          <CarouselNext className="shadow-sm" />
        </div>
      </Carousel>
    </div>
  )
}
