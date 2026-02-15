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
      <Card className="h-full w-full border-dashed bg-muted/20 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <Info className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-2">This is Artist</h3>
          <p className="text-sm text-muted-foreground">
            Configure your Last.fm credentials in Settings → Integrations to enable daily artist playlists.
          </p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full w-full border-destructive bg-destructive/5 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <p className="text-sm text-destructive">
            Error: {error}
          </p>
        </div>
      </Card>
    )
  }

  if (isGenerating) {
    return (
      <Card className="h-full w-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="text-sm">Generating today's playlist...</span>
        </div>
      </Card>
    )
  }

  if (playlist.length === 0 || !artist) {
    return (
      <Card className="h-full w-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <div className="text-center p-8">
          <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">This is Artist</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate your daily artist playlist
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={generate}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Playlist
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
    <Card className="h-full w-full overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 relative">
      {/* Refresh Button - Top Right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={generate}
        disabled={isGenerating}
        className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
      </Button>

      <ImageLoader id={artist.coverArt} type="artist" size="500">
        {(artistCoverUrl, isLoadingImage) => (
          <div className="h-full flex flex-col">
            {/* Artist Image Background */}
            <div className="relative flex-1 flex items-center justify-center p-8">
              {/* Background Blur */}
              {artistCoverUrl && (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-3xl scale-110 opacity-20"
                    style={{ backgroundImage: `url(${artistCoverUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
                </>
              )}

              {/* Main Artist Image */}
              <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">
                {artistCoverUrl && (
                  <div className="relative group">
                    <img
                      src={artistCoverUrl}
                      alt={artist.name}
                      className="w-64 h-64 rounded-2xl shadow-2xl object-cover"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-2xl" />
                  </div>
                )}
                {!artistCoverUrl && !isLoadingImage && (
                  <div className="w-64 h-64 rounded-2xl shadow-2xl bg-muted flex items-center justify-center">
                    <Music className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}

                {/* Text Info */}
                <div className="text-center space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Daily Playlist
                  </p>
                  <h2 className="text-3xl font-bold">
                    This is {artist.name}
                  </h2>
                  {lastUpdated && (
                    <p className="text-sm text-muted-foreground">
                      {lastUpdated} • {playlist.length} songs
                    </p>
                  )}
                </div>

                {/* Play Button */}
                <Button
                  size="lg"
                  onClick={handlePlay}
                  className="w-full max-w-xs gap-2 shadow-lg"
                >
                  <Play className="h-5 w-5" fill="currentColor" />
                  Play Playlist
                </Button>
              </div>
            </div>
          </div>
        )}
      </ImageLoader>
    </Card>
  )
}
