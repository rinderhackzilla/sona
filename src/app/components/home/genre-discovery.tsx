import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/app/components/ui/skeleton'
import { ImageLoader } from '@/app/components/image-loader'
import { useGetGenreDiscovery, useGetAlbumsByGenre } from '@/app/hooks/use-home'
import { ROUTES } from '@/routes/routesList'

const gradients = [
  'from-primary/15 via-primary/8 to-background/10',
  'from-primary/12 via-accent/10 to-background/10',
  'from-accent/14 via-primary/8 to-background/10',
]

interface GenreCardProps {
  genre: string
  albumCount?: number
  index: number
}

function GenreCard({ genre, albumCount, index }: GenreCardProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useGetAlbumsByGenre(genre, 16)

  if (!data?.list || data.list.length === 0) return null

  const randomSeed = genre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const selectedAlbum = data.list[randomSeed % data.list.length]

  return (
    <Link to={ROUTES.ALBUMS.GENRE(genre)} className="group block h-full">
      <div
        className={`relative h-[172px] overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br ${gradients[index % 3]} p-4 transition-colors hover:border-primary/35 sm:h-[186px]`}
      >
        {selectedAlbum?.coverArt && (
          <ImageLoader id={selectedAlbum.coverArt} type="album" size="520">
            {(src) =>
              src ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-md scale-105 opacity-30"
                    style={{ backgroundImage: `url(${src})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/35 via-background/22 to-background/35" />
                  <div
                    className="absolute right-0 top-0 h-full w-[58%] bg-cover bg-center opacity-70"
                    style={{
                      backgroundImage: `url(${src})`,
                      WebkitMaskImage: 'linear-gradient(to left, rgba(0, 0, 0, 1) 58%, rgba(0, 0, 0, 0) 100%)',
                      maskImage: 'linear-gradient(to left, rgba(0, 0, 0, 1) 58%, rgba(0, 0, 0, 0) 100%)',
                    }}
                  />
                  <div className="absolute right-0 top-0 h-full w-[62%] bg-gradient-to-l from-background/58 via-background/34 to-transparent" />
                </>
              ) : null
            }
          </ImageLoader>
        )}

        <div className="relative z-[1] flex h-full items-stretch justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-foreground/15 bg-foreground/5 px-2 py-1 text-xs text-foreground/75 backdrop-blur-sm">
                <Music className="h-3.5 w-3.5 text-foreground/65" />
                <span>{t('home.topGenre')}</span>
              </div>
              <h3 className="truncate text-[1.05rem] font-semibold leading-snug sm:text-[1.12rem]">{genre}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground/90">
                {t('genres.albumCount', { count: albumCount ?? data.list.length })}
              </p>
              {isLoading && <Skeleton className="mt-1 h-3 w-16" />}
            </div>
            <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">
              {t('home.browse')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function GenreDiscovery() {
  const { genres, isLoading } = useGetGenreDiscovery()

  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[...new Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[172px] rounded-xl sm:h-[186px]" />
          ))}
        </div>
      </div>
    )
  }

  if (!genres || genres.length === 0) return null

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {genres.slice(0, 3).map((genre, index) => (
          <GenreCard
            key={genre.value}
            genre={genre.value}
            albumCount={genre.albumCount}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
