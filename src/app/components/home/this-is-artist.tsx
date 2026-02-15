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
      <Card className="h-full w-full border-dashed bg-muted/20 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Info className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-semibold mb-1 text-sm">This is Artist</h3>
          <p className="text-xs text-muted-foreground">
            Configure Last.fm in Settings → Integrations
          </p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full w-full border-destructive bg-destructive/5 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs text-destructive">
            Error: {error}
          </p>
        </div>
      </Card>
    )
  }

  if (isGenerating) {
    return (
      <Card className="h-full w-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Generating...</span>
        </div>
      </Card>
    )
  }

  if (playlist.length === 0 || !artist) {
    return (
      <Card className="h-full w-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <div className="text-center p-6">
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
      </Card>
    )
  }

  const lastUpdated = lastGenerated
    ? new Date(lastGenerated).toLocaleDateString()
    : null

  const handlePlay = () => {
    setSongList(playlist, 0)
  }

  return (
    <Card className="h-full w-full overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 relative flex items-center justify-center p-6">
      {/* Refresh Button - Top Right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={generate}
        disabled={isGenerating}
        className="absolute top-3 right-3 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
      </Button>

      <ImageLoader id={artist.coverArt} type="artist" size="300">
        {(artistCoverUrl, isLoadingImage) => (
          <div className="flex flex-col items-center gap-3 max-w-xs w-full">
            {/* Artist Image */}
            {artistCoverUrl && (
              <div className="relative">
                <img
                  src={artistCoverUrl}
                  alt={artist.name}
                  className="w-40 h-40 rounded-xl shadow-xl object-cover"
                />
              </div>
            )}
            {!artistCoverUrl && !isLoadingImage && (
              <div className="w-40 h-40 rounded-xl shadow-xl bg-muted flex items-center justify-center">
                <Music className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            {/* Text Info */}
            <div className="text-center space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Daily Playlist
              </p>
              <h2 className="text-xl font-bold leading-tight">
                This is {artist.name}
              </h2>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  {playlist.length} songs
                </p>
              )}
            </div>

            {/* Play Button */}
            <Button
              size="default"
              onClick={handlePlay}
              className="w-full gap-1.5 shadow-md"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Play
            </Button>
          </div>
        )}
      </ImageLoader>
    </Card>
  )
}
