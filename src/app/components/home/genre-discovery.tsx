import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/app/components/ui/skeleton'
import { ImageLoader } from '@/app/components/image-loader'
import { useGetGenreDiscovery, useGetAlbumsByGenre } from '@/app/hooks/use-home'
import { ROUTES } from '@/routes/routesList'

const gradients = [
  'from-purple-500/20 to-pink-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-orange-500/20 to-red-500/20',
]

const iconColors = [
  'text-purple-400',
  'text-blue-400',
  'text-orange-400',
]

interface GenreCardProps {
  genre: string
  index: number
}

function GenreCard({ genre, index }: GenreCardProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useGetAlbumsByGenre(genre, 16)

  if (!data?.list || data.list.length === 0) return null

  const albums = data.list.slice(0, 3)

  return (
    <Link to={ROUTES.ALBUMS.GENRE(genre)} className="group block">
      <div
        className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${gradients[index % 3]} border border-border/50 h-[148px] sm:h-[164px] hover:border-primary/40 transition-colors p-4`}
      >
        <div className="flex justify-between h-full">
          {/* Left: icon + name + count + link hint */}
          <div className="flex flex-col justify-between min-w-0 pr-3">
            <div>
              <Music className={`w-4 h-4 mb-2 ${iconColors[index % 3]}`} />
              <h3 className="text-base font-bold leading-snug truncate">{genre}</h3>
              {data?.list && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('genres.albumCount', { count: data.list.length })}
                </p>
              )}
              {isLoading && <Skeleton className="h-3 w-16 mt-1" />}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              {t('home.browse')}
            </span>
          </div>

          {/* Right: stacked album thumbs */}
          <div className="flex flex-col gap-1.5 justify-center flex-shrink-0">
            {isLoading
              ? [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="w-11 h-11 rounded-md" />
                ))
              : albums.map((album) => (
                  <ImageLoader key={album.id} id={album.coverArt} type="album" size="150">
                    {(src) =>
                      src ? (
                        <img
                          src={src}
                          alt={album.name}
                          className="w-11 h-11 rounded-md object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-md bg-muted" />
                      )
                    }
                  </ImageLoader>
                ))}
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
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...new Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[148px] sm:h-[164px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!genres || genres.length === 0) return null

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {genres.slice(0, 3).map((genre, index) => (
          <GenreCard key={genre} genre={genre} index={index} />
        ))}
      </div>
    </div>
  )
}
