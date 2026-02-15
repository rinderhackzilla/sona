import { useEffect } from 'react'
import { RefreshCw, Sparkles, Settings, Play, Shuffle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader } from '@/app/components/ui/card'
import { useDiscoverWeekly } from '@/app/hooks/use-discover-weekly'
import { usePlayerActions } from '@/store/player.store'

export function DiscoverWeekly() {
  const {
    playlist,
    isGenerating,
    error,
    lastGenerated,
    artistsUsed,
    generate,
    checkAndRegenerate,
    isConfigured,
  } = useDiscoverWeekly()
  const { setSongList } = usePlayerActions()

  // Check if playlist needs regeneration on mount
  useEffect(() => {
    if (isConfigured && !isGenerating) {
      checkAndRegenerate()
    }
  }, [isConfigured, isGenerating, checkAndRegenerate])

  if (!isConfigured) {
    return (
      <div className="mb-6">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <CardDescription>
                  Configure Last.fm credentials to get personalized song
                  recommendations based on your listening history.
                  <Button
                    variant="link"
                    className="h-auto p-0 ml-1"
                    onClick={() => {
                      window.location.hash = '#/settings/integrations'
                    }}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Go to Settings
                  </Button>
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
              Error generating Discover Weekly: {error}
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
          <span>Generating your personalized playlist...</span>
        </div>
      </div>
    )
  }

  if (playlist.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Discover Weekly
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={generate}
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
            <Sparkles className="h-5 w-5" />
            Discover Weekly
          </h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated {lastUpdated}
              {artistsUsed.length > 0 && ` • ${artistsUsed.length} artists`}
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
            onClick={generate}
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
            {playlist.length} songs personalized for you
          </p>
          <div className="space-y-2">
            {playlist.slice(0, 10).map((song, index) => (
              <div
                key={song.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                onClick={() => setSongList(playlist, index)}
              >
                <div className="text-sm text-muted-foreground w-8">
                  {index + 1}
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
