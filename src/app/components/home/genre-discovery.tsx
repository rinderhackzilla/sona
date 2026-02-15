import { useGetGenreDiscovery, useGetAlbumsByGenre } from '@/app/hooks/use-home'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { Music } from 'lucide-react'
import { AlbumListResponse } from '@/types/responses/album'
import { Skeleton } from '@/app/components/ui/skeleton'
import AlbumCard from '@/app/components/cards/album-card'

interface GenreRowProps {
  genre: string
  index: number
}

function GenreRow({ genre, index }: GenreRowProps) {
  const { data, isLoading } = useGetAlbumsByGenre(genre, 8)

  if (isLoading) {
    return (
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="min-w-[180px] h-[240px] rounded-lg" />
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
    <div className="mb-8">
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
        <Link
          to={`${ROUTES.ALBUMS.INDEX}?genre=${encodeURIComponent(genre)}`}
          className="text-sm text-primary hover:underline"
        >
          See all
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {data.list.map((album) => (
          <div key={album.id} className="min-w-[180px]">
            <AlbumCard album={album} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GenreDiscovery() {
  const { genres, isLoading } = useGetGenreDiscovery()

  if (isLoading) {
    return (
      <div className="mb-12">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[...Array(8)].map((_, j) => (
                  <Skeleton
                    key={j}
                    className="min-w-[180px] h-[240px] rounded-lg"
                  />
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
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Discover by Genre</h2>
        <p className="text-muted-foreground">
          Explore albums from genres you love
        </p>
      </div>

      {genres.map((genre, index) => (
        <GenreRow key={genre} genre={genre} index={index} />
      ))}
    </div>
  )
}
