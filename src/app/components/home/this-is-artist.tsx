import { RefreshCw, Music, Play, Shuffle, Info } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
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
      <div className="h-full w-full">
        <Card className="border-dashed h-full w-full">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <CardTitle className="text-base mb-2">
                  This is Artist
                </CardTitle>
                <CardDescription>
                  Get a daily playlist featuring a random artist from your library with their top tracks.
                  <br />
                  <strong>Setup:</strong> Configure your Last.fm username and API key in the sidebar settings (⚙️) → Integrations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full">
        <Card className="border-destructive h-full w-full">
          <CardHeader>
            <CardDescription className="text-destructive">
              Error generating This is Artist: {error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="h-full w-full">
        <Card className="h-full w-full flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground p-8">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Generating today's artist playlist...</span>
          </div>
        </Card>
      </div>
    )
  }

  if (playlist.length === 0 || !artist) {
    return (
      <div className="h-full w-full">
        <Card className="h-full w-full flex items-center justify-center">
          <div className="text-center p-8">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">This is Artist</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your daily artist playlist hasn't been generated yet.
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
      </div>
    )
  }

  const lastUpdated = lastGenerated
    ? new Date(lastGenerated).toLocaleDateString()
    : null

  const handlePlayAll = () => {
    setSongList(playlist, 0)
  }

  const handlePlayShuffle = () => {
    const shuffled = [...playlist].sort(() => Math.random() - 0.5)
    setSongList(shuffled, 0)
  }

  return (
    <div className="h-full w-full">
      <ImageLoader id={artist.coverArt} type="artist" size="300">
        {(artistCoverUrl, isLoadingImage) => (
          <Card className="h-full w-full overflow-hidden flex flex-col">
            {/* Artist Cover Header */}
            <div className="relative h-48 bg-gradient-to-b from-primary/20 to-background flex-shrink-0">
              {artistCoverUrl && (
                <img
                  src={artistCoverUrl}
                  alt={artist.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-end gap-4">
                  {artistCoverUrl && (
                    <img
                      src={artistCoverUrl}
                      alt={artist.name}
                      className="w-24 h-24 rounded-lg shadow-lg object-cover"
                    />
                  )}
                  {!artistCoverUrl && !isLoadingImage && (
                    <div className="w-24 h-24 rounded-lg shadow-lg bg-muted flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Daily Playlist
                    </p>
                    <h2 className="text-2xl font-bold truncate">
                      This is {artist.name}
                    </h2>
                    {lastUpdated && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {lastUpdated} • {playlist.length} songs
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-b flex-shrink-0">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePlayAll}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayShuffle}
                  className="flex-1"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Shuffle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generate}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Song List Preview */}
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                Top Tracks
              </p>
              <div className="space-y-1">
                {playlist.slice(0, 10).map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSongList(playlist, index)}
                  >
                    <div className="text-xs text-muted-foreground w-6 text-right">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {song.album}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {playlist.length > 10 && (
                <p className="text-xs text-muted-foreground text-center mt-4 py-2">
                  + {playlist.length - 10} more songs
                </p>
              )}
            </div>
          </Card>
        )}
      </ImageLoader>
    </div>
  )
}
