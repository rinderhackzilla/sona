import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Sparkles, Settings } from 'lucide-react'
import { PreviewList } from './preview-list'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader } from '@/app/components/ui/card'
import { useDiscoverWeekly } from '@/app/hooks/use-discover-weekly'
import { useAudioPlayer } from '@/store/player.store'

export function DiscoverWeekly() {
  const { t } = useTranslation()
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
  const { setQueue } = useAudioPlayer()

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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
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

      <PreviewList
        songs={playlist.slice(0, 10)}
        onPlayAll={() => setQueue(playlist)}
        onPlayShuffle={() => {
          const shuffled = [...playlist].sort(() => Math.random() - 0.5)
          setQueue(shuffled)
        }}
      />
    </div>
  )
}
