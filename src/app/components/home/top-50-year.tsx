import { RefreshCw, Trophy, Play, Shuffle, Info } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { useTop50Year } from '@/app/hooks/use-top-50-year'
import { usePlayerActions } from '@/store/player.store'

export function Top50Year() {
  const {
    playlist,
    totalTracks,
    isGenerating,
    error,
    lastGenerated,
    year,
    generate,
    isConfigured,
  } = useTop50Year()
  const { setSongList } = usePlayerActions()

  if (!isConfigured) {
    return (
      <div className="mb-6">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <CardTitle className="text-base mb-2">
                  Top 50 Year
                </CardTitle>
                <CardDescription>
                  Your top 50 most played tracks from the last 12 months based on your Last.fm listening history.
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
      <div className="mb-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardDescription className="text-destructive">
              Error generating Top 50: {error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Generating your Top 50 playlist...</span>
        </div>
      </div>
    )
  }

  if (playlist.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 50 of {year}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate()}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Playlist
          </Button>
        </div>
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 50 of {year}
          </h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated {lastUpdated}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handlePlayAll}
          >
            <Play className="h-4 w-4 mr-2" />
            Play All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayShuffle}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate()}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Your {totalTracks} most played tracks from the last 12 months
          </p>
          <div className="space-y-2">
            {playlist.slice(0, 10).map((song, index) => (
              <div
                key={song.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                onClick={() => setSongList(playlist, index)}
              >
                <div className="text-sm font-bold text-yellow-500 w-8">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {song.artist}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {song.album}
                </div>
              </div>
            ))}
          </div>
          {playlist.length > 10 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              + {playlist.length - 10} more songs
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
