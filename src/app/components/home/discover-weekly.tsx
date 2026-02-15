import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Sparkles } from 'lucide-react'
import { PreviewList } from './preview-list'
import { Button } from '@/app/components/ui/button'
import { useDiscoverWeekly } from '@/app/hooks/use-discover-weekly'
import { useAudioPlayer } from '@/store/player.store'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

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
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            {t('home.discoverWeekly.configure')}
            <Button
              variant="link"
              className="h-auto p-0 ml-1"
              onClick={() => {
                // Navigate to settings - you'll need to implement this
                window.location.hash = '#/settings/integrations'
              }}
            >
              {t('home.discoverWeekly.goToSettings')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <Alert variant="destructive">
          <AlertDescription>
            {t('home.discoverWeekly.error')}: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>{t('home.discoverWeekly.generating')}</span>
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
            {t('home.discoverWeekly.title')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={generate}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('home.discoverWeekly.generate')}
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
            {t('home.discoverWeekly.title')}
          </h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('home.discoverWeekly.lastUpdated', { date: lastUpdated })}
              {artistsUsed.length > 0 &&
                ` • ${artistsUsed.length} ${t('home.discoverWeekly.artists')}`}
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
          {t('home.discoverWeekly.refresh')}
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
