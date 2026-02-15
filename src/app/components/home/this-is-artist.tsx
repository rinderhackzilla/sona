import { RefreshCw, Music, Play, Info } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { ImageLoader } from '@/app/components/image-loader'
import { useThisIsArtist } from '@/app/hooks/use-this-is-artist'
import { usePlayerActions } from '@/store/player.store'

export function ThisIsArtist() {
  const {
    playlist,
    artist,
    isGenerating,
    error,
    lastGenerated,
    generate,
    isConfigured,
  } = useThisIsArtist()
  const { setSongList } = usePlayerActions()

  if (!isConfigured) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg bg-muted/20 border-dashed">
        <div className="relative h-full flex items-center justify-center p-8 z-10">
          <div className="text-center max-w-sm">
            <Info className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-semibold mb-1 text-sm">This is Artist</h3>
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
            <p className="text-xs text-destructive">
              Error: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-primary/10" />
        <div className="relative h-full flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Generating...</span>
          </div>
        </div>
      </div>
    )
  }

  if (playlist.length === 0 || !artist) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-primary/10" />
        <div className="relative h-full flex items-center justify-center p-8 z-10">
          <div className="text-center">
            <Music className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2 text-sm">This is Artist</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Generate your daily playlist
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={generate}
              disabled={isGenerating}
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Generate
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handlePlay = () => {
    setSongList(playlist, 0)
  }

  return (
    <div className="relative w-full h-full overflow-hidden border rounded-lg">
      {/* Background Image with Blur */}
      <ImageLoader id={artist.coverArt} type="artist" size="300">
        {(artistCoverUrl) => (
          <>
            {artistCoverUrl && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40"
                  style={{ backgroundImage: `url(${artistCoverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-l from-background/80 via-background/60 to-background/80" />
              </>
            )}
          </>
        )}
      </ImageLoader>

      {/* Content */}
      <div className="relative h-full flex items-center gap-6 px-8 z-10">
        {/* Info - Left Side (mirrored from hero slider) */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Daily Playlist
            </p>
            <h2 className="text-4xl 2xl:text-5xl font-bold leading-tight">
              This is<br />{artist.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {playlist.length} {playlist.length === 1 ? 'song' : 'songs'}
            </span>
            {lastGenerated && (
              <span className="text-sm text-muted-foreground">
                • {new Date(lastGenerated).toLocaleDateString()}
              </span>
            )}
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

        {/* Artist Image - Right Side */}
        <div className="flex-shrink-0 relative">
          <ImageLoader id={artist.coverArt} type="artist" size="300">
            {(artistCoverUrl, isLoadingImage) => (
              <>
                {artistCoverUrl && (
                  <img
                    src={artistCoverUrl}
                    alt={artist.name}
                    className="w-[180px] h-[180px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl object-cover"
                  />
                )}
                {!artistCoverUrl && !isLoadingImage && (
                  <div className="w-[180px] h-[180px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl bg-muted flex items-center justify-center">
                    <Music className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </>
            )}
          </ImageLoader>

          {/* Refresh Button - On Image */}
          <Button
            variant="secondary"
            size="icon"
            onClick={generate}
            disabled={isGenerating}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  )
}
