import { Play, Heart, Shuffle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'
import { usePlayerActions } from '@/store/player.store'
import { subsonic } from '@/service/subsonic'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/utils/queryKeys'

interface QuickAccessCard {
  title: string
  icon: React.ReactNode
  gradient: string
  onClick?: () => void
  href?: string
}

export default function QuickAccess() {
  const { setPlaylist } = usePlayerActions()
  const queryClient = useQueryClient()

  const handleShuffleAll = async () => {
    const songs = await subsonic.songs.getRandomSongs({ size: 100 })
    if (songs) {
      setPlaylist({ songList: songs, index: 0, playlistName: 'Shuffle All' })
    }
  }

  const handleContinueListening = () => {
    // Get recently played and continue
    const recentlyPlayed = queryClient.getQueryData([
      queryKeys.album.recentlyPlayed,
    ]) as any
    if (recentlyPlayed?.list?.[0]) {
      // Play first album from recently played
      window.location.href = `${ROUTES.ALBUMS.INDEX}/${recentlyPlayed.list[0].id}`
    }
  }

  const cards: QuickAccessCard[] = [
    {
      title: 'Continue Listening',
      icon: <Play className="w-8 h-8" />,
      gradient: 'from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30',
      onClick: handleContinueListening,
    },
    {
      title: 'Your Favorites',
      icon: <Heart className="w-8 h-8" />,
      gradient: 'from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30',
      href: ROUTES.SONGS.FAVORITES,
    },
    {
      title: 'Shuffle All',
      icon: <Shuffle className="w-8 h-8" />,
      gradient: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30',
      onClick: handleShuffleAll,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => {
        const content = (
          <div
            className={cn(
              'group relative overflow-hidden rounded-lg p-6 cursor-pointer transition-all duration-300',
              'bg-gradient-to-br border border-border/50',
              'hover:border-border hover:shadow-lg',
              card.gradient,
            )}
            onClick={card.onClick}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-background/50 backdrop-blur-sm group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold">{card.title}</h3>
            </div>
            
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )

        if (card.href) {
          return (
            <Link key={card.title} to={card.href}>
              {content}
            </Link>
          )
        }

        return <div key={card.title}>{content}</div>
      })}
    </div>
  )
}
