import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ImageLoader } from '@/app/components/image-loader'
import { PreviewCard } from '@/app/components/preview-card/card'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/app/components/ui/carousel'
import { CarouselButton } from '@/app/components/ui/carousel-button'
import { ROUTES } from '@/routes/routesList'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { Albums } from '@/types/responses/album'

interface PreviewListProps {
  list: Albums[]
  title: string
  icon?: ReactNode
  showMore?: boolean
  moreTitle?: string
  moreRoute?: string
}

export default function PreviewList({
  list,
  title,
  icon,
  showMore = true,
  moreTitle,
  moreRoute,
}: PreviewListProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState<boolean>()
  const [canScrollNext, setCanScrollNext] = useState<boolean>()
  const { setSongList } = usePlayerActions()
  const { t } = useTranslation()

  moreTitle = moreTitle || t('generic.seeMore')

  if (list.length > 16) {
    list = list.slice(0, 16)
  }

  async function handlePlayAlbum(album: Albums) {
    const response = await subsonic.albums.getOne(album.id)

    if (response) {
      setSongList(response.song, 0)
    }
  }

  useEffect(() => {
    if (!api) {
      return
    }

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())

    api.on('select', () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    })
  }, [api])

  return (
    <div className="mt-3 flex w-full flex-col sm:mt-4">
      <div className="mb-2.5 flex items-center justify-between sm:mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3
            className="scroll-m-20 text-[1.1rem] font-semibold tracking-tight sm:text-xl"
            data-testid="preview-list-title"
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3">
          {showMore && moreRoute && (
            <Link to={moreRoute} data-testid="preview-list-show-more">
              <p className="truncate text-xs text-muted-foreground hover:text-primary hover:underline sm:text-sm">
                {moreTitle}
              </p>
            </Link>
          )}
          <div className="flex gap-2">
            <CarouselButton
              direction="prev"
              disabled={!canScrollPrev}
              onClick={() => api?.scrollPrev()}
              data-testid="preview-list-prev-button"
            />
            <CarouselButton
              direction="next"
              disabled={!canScrollNext}
              onClick={() => api?.scrollNext()}
              data-testid="preview-list-next-button"
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
          data-testid="preview-list-carousel"
        >
          <CarouselContent>
            {list.map((album, index) => (
              <CarouselItem
                key={album.id}
                className="basis-[56%] sm:basis-[38%] md:basis-[30%] lg:basis-[24%] xl:basis-[20%] 2xl:basis-[17.5%]"
                data-testid={`preview-list-carousel-item-${index}`}
              >
                <PreviewCard.Root>
                  <PreviewCard.ImageWrapper link={ROUTES.ALBUM.PAGE(album.id)}>
                    <ImageLoader id={album.coverArt} type="album">
                      {(src) => (
                        <PreviewCard.Image src={src} alt={album.name} />
                      )}
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
