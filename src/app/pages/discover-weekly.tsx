import { RefreshCw, Sparkles, Play, Shuffle, Info } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { useDiscoverWeekly } from '@/app/hooks/use-discover-weekly'
import { usePlayerActions } from '@/store/player.store'

export default function DiscoverWeeklyPage() {
  const {
    playlist,
    isGenerating,
    error,
    lastGenerated,
    artistsUsed,
    generate,
    isConfigured,
  } = useDiscoverWeekly()
  const { setSongList } = usePlayerActions()

  // Note: Catch-up check happens automatically in the hook on mount

  if (!isConfigured) {
    return (
      <div className="w-full px-8 py-6">
        <Card className="border-dashed max-w-2xl mx-auto mt-12">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <CardTitle className="text-xl mb-3">
                  Setup Discover Weekly
                </CardTitle>
                <CardDescription className="text-base">
                  Get personalized song recommendations based on your Last.fm listening history.
                  <br />
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
      <div className="w-full px-8 py-6">
        <Card className="border-destructive max-w-2xl mx-auto mt-12">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription className="text-destructive">
              {error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="w-full px-8 py-6">
        <div className="flex items-center justify-center gap-3 mt-12">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-lg">Generating your personalized playlist...</span>
        </div>
      </div>
    )
  }

  if (playlist.length === 0) {
    return (
      <div className="w-full px-8 py-6">
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-4">Discover Weekly</h2>
          <p className="text-muted-foreground mb-6">
            Your personalized playlist hasn't been generated yet.
          </p>
          <Button
            size="lg"
            onClick={generate}
            disabled={isGenerating}
          >
            <Sparkles className="h-4 w-4 mr-2" />
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
    <div className="w-full px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            Discover Weekly
          </h1>
          {lastUpdated && (
            <p className="text-muted-foreground mt-2">
              Last updated {lastUpdated}
              {artistsUsed.length > 0 && ` • ${artistsUsed.length} artists`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="default"
            onClick={handlePlayAll}
          >
            <Play className="h-4 w-4 mr-2" />
            Play All
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={handlePlayShuffle}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={generate}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            {playlist.length} songs personalized for you
          </p>
          <div className="space-y-1">
            {playlist.map((song, index) => (
              <div
                key={song.id}
                className="flex items-center gap-4 p-3 rounded hover:bg-accent cursor-pointer group"
                onClick={() => setSongList(playlist, index)}
              >
                <div className="text-sm text-muted-foreground w-10 text-right">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary">
                    {song.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {song.artist} • {song.album}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
