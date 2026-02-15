import { Calendar, Music, Play, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/app/components/ui/button'
import { ImageLoader } from '@/app/components/image-loader'
import { useDiscoverWeekly } from '@/app/hooks/use-discover-weekly'
import { usePlayerActions } from '@/store/player.store'
import { subsonic } from '@/service/subsonic'
import { queryKeys } from '@/utils/queryKeys'
import { ROUTES } from '@/routes/routesList'

export function DiscoverWeeklyCard() {
  const { playlist, isGenerating, error, isConfigured } = useDiscoverWeekly()
  const { setSongList } = usePlayerActions()

  // Fetch subsonic playlists to find "Discover Weekly" playlist ID
  const { data: subsonicPlaylists } = useQuery({
    queryKey: [queryKeys.playlist.all],
    queryFn: subsonic.playlists.getAll,
  })

  // Find the Discover Weekly playlist from subsonic
  const discoverWeeklyPlaylist = subsonicPlaylists?.find(
    (p) => p.name === 'Discover Weekly'
  )

  if (!isConfigured) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg bg-muted/20 border-dashed">
        <div className="relative h-full flex items-center justify-center p-8 z-10">
          <div className="text-center max-w-sm">
            <Info className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-semibold mb-1 text-sm">Discover Weekly</h3>
            <p className="text-xs text-muted-foreground">
              Configure Last.fm in Settings → Integrations
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg bg-destructive/5 border-destructive">
        <div className="relative h-full flex items-center justify-center p-8 z-10">
          <div className="text-center max-w-sm">
            <p className="text-xs text-destructive">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative h-full flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-6 w-6 animate-pulse text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!playlist || playlist.length === 0) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative h-full flex items-center justify-center p-8 z-10">
          <div className="text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2 text-sm">Discover Weekly</h3>
            <p className="text-xs text-muted-foreground">
              Your weekly playlist will be generated soon
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handlePlay = () => {
    setSongList(playlist, 0)
  }

  // Get cover art from first song
  const coverArt = playlist[0]?.coverArt

  // Cover image component (with optional link)
  const CoverImage = () => {
    const imageContent = (
      <>
        {coverArt ? (
          <ImageLoader id={coverArt} type="album" size="300">
            {(src, isLoadingImage) => (
              <>
                {src && (
                  <img
                    src={src}
                    alt="Discover Weekly"
                    className="w-[180px] h-[180px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl object-cover transition-transform hover:scale-105"
                  />
                )}
                {!src && !isLoadingImage && (
                  <div className="w-[180px] h-[180px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </>
            )}
          </ImageLoader>
        ) : (
          <div className="w-[180px] h-[180px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </>
    )

    // If we found the subsonic playlist, wrap in Link
    if (discoverWeeklyPlaylist) {
      return (
        <Link
          to={ROUTES.PLAYLIST.PAGE(discoverWeeklyPlaylist.id)}
          className="flex-shrink-0 relative"
        >
          {imageContent}
        </Link>
      )
    }

    // Otherwise just show the image
    return <div className="flex-shrink-0 relative">{imageContent}</div>
  }

  return (
    <div className="relative w-full h-full overflow-hidden border rounded-lg">
      {/* Background Image with Blur */}
      {coverArt && (
        <ImageLoader id={coverArt} type="album" size="300">
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
      )}
      {!coverArt && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
      )}

      {/* Content */}
      <div className="relative h-full flex items-center gap-6 px-8 z-10">
        {/* Cover Image - Left Side (with conditional link) */}
        <CoverImage />

        {/* Info - Right Side */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Your Weekly Mix
            </p>
            <h2 className="text-4xl 2xl:text-5xl font-bold leading-tight">
              Discover<br />Weekly
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {playlist.length} {playlist.length === 1 ? 'song' : 'songs'}
            </span>
          </div>

          <Button
            onClick={handlePlay}
            className="w-fit gap-2"
            size="lg"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Play
          </Button>
        </div>
      </div>
    </div>
  )
}
