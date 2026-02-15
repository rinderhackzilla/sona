import { useEffect, useState } from 'react'
import { useGetGenreDiscovery, useGetAlbumsByGenre } from '@/app/hooks/use-home'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { Music } from 'lucide-react'
import { Skeleton } from '@/app/components/ui/skeleton'
import { PreviewCard } from '@/app/components/preview-card/card'
import { ImageLoader } from '@/app/components/image-loader'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/app/components/ui/carousel'
import { CarouselButton } from '@/app/components/ui/carousel-button'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { Albums } from '@/types/responses/album'

interface GenreRowProps {
  genre: string
  index: number
}

function GenreRow({ genre, index }: GenreRowProps) {
  const { data, isLoading } = useGetAlbumsByGenre(genre, 16)
  const { setSongList } = usePlayerActions()
  const [api, setApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState<boolean>(false)
  const [canScrollNext, setCanScrollNext] = useState<boolean>(false)

  useEffect(() => {
    if (!api) return

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())

    api.on('select', () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    })
  }, [api])

  async function handlePlayAlbum(album: Albums) {
    const response = await subsonic.albums.getOne(album.id)
    if (response) {
      setSongList(response.song, 0)
    }
  }

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
        <div className="flex gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="basis-1/6">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-3 w-2/3 mt-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data?.list || data.list.length === 0) return null

  const gradients = [
    'from-purple-500/10 to-pink-500/10',
    'from-blue-500/10 to-cyan-500/10',
    'from-orange-500/10 to-red-500/10',
  ]

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg bg-gradient-to-br ${gradients[index % 3]}`}
          >
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{genre}</h3>
            <p className="text-sm text-muted-foreground">
              Based on your listening
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`${ROUTES.ALBUMS.INDEX}?genre=${encodeURIComponent(genre)}`}
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            See all
          </Link>
          <div className="flex gap-2">
            <CarouselButton
              direction="prev"
              disabled={!canScrollPrev}
              onClick={() => api?.scrollPrev()}
            />
            <CarouselButton
              direction="next"
              disabled={!canScrollNext}
              onClick={() => api?.scrollNext()}
            />
          </div>
        </div>
      </div>

      <div className="transform-gpu">
        <Carousel
          opts={{
            align: 'start',
            slidesToScroll: 'auto',
          }}
          setApi={setApi}
        >
          <CarouselContent>
            {data.list.map((album) => (
              <CarouselItem
                key={album.id}
                className="basis-1/6 2xl:basis-1/8"
              >
                <PreviewCard.Root>
                  <PreviewCard.ImageWrapper link={ROUTES.ALBUM.PAGE(album.id)}>
                    <ImageLoader id={album.coverArt} type="album">
                      {(src) => <PreviewCard.Image src={src} alt={album.name} />}
                    </ImageLoader>
                    <PreviewCard.PlayButton
                      onClick={() => handlePlayAlbum(album)}
                    />
                  </PreviewCard.ImageWrapper>
                  <PreviewCard.InfoWrapper>
                    <PreviewCard.Title link={ROUTES.ALBUM.PAGE(album.id)}>
                      {album.name}
                    </PreviewCard.Title>
                    <PreviewCard.Subtitle
                      enableLink={album.artistId !== undefined}
                      link={ROUTES.ARTIST.PAGE(album.artistId ?? '')}
                    >
                      {album.artist}
                    </PreviewCard.Subtitle>
                  </PreviewCard.InfoWrapper>
                </PreviewCard.Root>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}

export default function GenreDiscovery() {
  const { genres, isLoading } = useGetGenreDiscovery()

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                </div>
              </div>
              <div className="flex gap-4">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="basis-1/6">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-3 w-2/3 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!genres || genres.length === 0) return null

  return (
    <div className="mb-8">
      <div className="space-y-6">
        {genres.map((genre, index) => (
          <GenreRow key={genre} genre={genre} index={index} />
        ))}
      </div>
    </div>
  )
}
