import { Play } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { OnRepeatItem } from '@/app/components/home/carousel/on-repeat-item'
import { ImageLoader } from '@/app/components/image-loader'
import { Button } from '@/app/components/ui/button'
import { useOnRepeat } from '@/app/hooks/use-on-repeat'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { Albums } from '@/types/responses/album'

interface AlbumHeaderProps {
  albums: Albums[]
  title?: string
  subtitle?: string
}

function HeroThumbnail({
  isActive,
  onClick,
  coverArt,
  type,
  alt,
}: {
  isActive: boolean
  onClick: () => void
  coverArt?: string
  type: 'album' | 'song'
  alt: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative aspect-square w-full max-w-[64px] shrink-0 overflow-hidden rounded-md border transition-all duration-200',
        isActive
          ? 'border-primary/70 ring-1 ring-primary/45'
          : 'border-border/60 opacity-80 hover:opacity-100',
      )}
      aria-label={alt}
    >
      {coverArt ? (
        <ImageLoader id={coverArt} type={type} size="240">
          {(src) => (
            <img src={src} alt={alt} className="h-full w-full object-cover" />
          )}
        </ImageLoader>
      ) : (
        <div className="h-full w-full bg-muted/60" />
      )}
    </button>
  )
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
    <div className="relative h-full w-full overflow-hidden">
      {/* Background Image with Blur */}
      <ImageLoader id={album.coverArt} type="album">
        {(src) => (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-45"
              style={{ backgroundImage: `url(${src})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/72 via-background/52 to-background/86" />
          </>
        )}
      </ImageLoader>

      {/* Content */}
      <div className="relative z-10 grid h-full grid-cols-[auto,minmax(0,1fr)] items-center gap-5 py-4 pl-7 pr-5 min-[1700px]:gap-6 min-[1700px]:py-5 min-[1700px]:pl-8 min-[1700px]:pr-6 min-[2600px]:gap-7 min-[2600px]:pl-9 min-[2600px]:pr-7">
        <div className="flex flex-col items-center justify-center gap-3">
          <Link
            to={ROUTES.ALBUM.PAGE(album.id)}
            className="group relative block"
          >
            <ImageLoader id={album.coverArt} type="album">
              {(src) => (
                <img
                  src={src}
                  alt={album.name}
                  className={cn(
                    'aspect-square h-[236px] w-[236px] rounded-xl border border-border/55 object-cover shadow-2xl transition-all duration-300 group-hover:scale-[1.02] min-[1700px]:h-[272px] min-[1700px]:w-[272px] min-[2600px]:h-[300px] min-[2600px]:w-[300px]',
                    imageLoaded ? 'opacity-100' : 'opacity-0',
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
              )}
            </ImageLoader>
          </Link>

          <div className="w-[236px] min-[1700px]:w-[272px] min-[2600px]:w-[300px]">
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border/60 bg-background/70 px-3 py-1.5 text-center text-sm text-foreground/80 min-[2300px]:text-base">
              {album.genre && <span className="truncate">{album.genre}</span>}
              {album.genre && album.year && (
                <span className="text-foreground/40">•</span>
              )}
              {album.year && <span>{album.year}</span>}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3 text-left">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground/90 min-[1700px]:text-base">
              {t('home.recommendedAlbum')}
            </p>
            <Link to={ROUTES.ALBUM.PAGE(album.id)} className="hover:underline">
              <h2 className="line-clamp-2 break-words text-[1.9rem] font-bold leading-tight min-[1700px]:text-[2.2rem] min-[2600px]:text-[2.45rem]">
                {album.name}
              </h2>
            </Link>
            <Link
              to={ROUTES.ARTIST.PAGE(album.artistId || '')}
              className="inline-block text-base text-muted-foreground hover:text-primary hover:underline min-[1700px]:text-[1.1rem]"
            >
              {album.artist}
            </Link>
          </div>

          <Button
            onClick={handlePlayAlbum}
            className="mt-4 h-10 w-fit gap-2 border border-primary/30 bg-primary/90 px-4 text-sm hover:bg-primary"
            size="default"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            {t('options.play')}
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
  const [currentSlide, setCurrentSlide] = useState(0)
  const { data: onRepeat, isLoading: onRepeatLoading } = useOnRepeat()
  const carouselItems = useMemo(() => {
    const items: Array<
      | { type: 'onRepeat'; data: NonNullable<typeof onRepeat> }
      | { type: 'album'; data: Albums }
    > = []

    if (onRepeat?.song) {
      items.push({
        type: 'onRepeat',
        data: onRepeat,
      })
    }

    const maxAlbums = onRepeat?.song ? 5 : 6
    const limitedAlbums = albums.slice(0, maxAlbums)
    limitedAlbums.forEach((album) => {
      items.push({
        type: 'album',
        data: album,
      })
    })

    return items
  }, [albums, onRepeat])

  useEffect(() => {
    if (carouselItems.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
    }, 9000)
    return () => {
      clearInterval(timer)
    }
  }, [carouselItems.length])

  if (carouselItems.length === 0 && !onRepeatLoading) return null

  return (
    <div className="h-full">
      {title && (
        <div className="mb-4">
          <h2 className="text-3xl font-bold">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="flex h-full overflow-hidden rounded-xl border border-border/60 bg-card/20 min-[1600px]:rounded-2xl">
        <div className="flex h-full w-[90px] flex-col items-center justify-between overflow-hidden border-r border-border/55 bg-foreground/[0.03] px-2.5 py-3">
          {carouselItems.map((item, index) => (
            <HeroThumbnail
              key={`thumb-${item.type === 'onRepeat' ? 'on-repeat' : item.data.id}`}
              isActive={currentSlide === index}
              onClick={() => setCurrentSlide(index)}
              coverArt={
                item.type === 'onRepeat'
                  ? item.data.song.coverArt
                  : item.data.coverArt
              }
              type="album"
              alt={
                item.type === 'onRepeat' ? item.data.song.title : item.data.name
              }
            />
          ))}
        </div>

        <div className="relative h-full w-full overflow-hidden">
          {carouselItems.map((item, index) => {
            const isActive = currentSlide === index
            return (
              <div
                key={item.type === 'onRepeat' ? 'on-repeat' : item.data.id}
                className={cn(
                  'absolute inset-0 transition-opacity duration-700 ease-in-out',
                  isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
              >
                {item.type === 'onRepeat' ? (
                  <OnRepeatItem
                    song={item.data.song}
                    playcount={item.data.playcount}
                  />
                ) : (
                  <AlbumHeaderItem album={item.data} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
