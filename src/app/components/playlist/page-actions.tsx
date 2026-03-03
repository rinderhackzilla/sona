import { Play, RefreshCw, Save, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'

interface PlaylistPageActionsProps {
  onPlayAll: () => void
  onShuffle: () => void
  onRefresh: () => void
  isRefreshing?: boolean
  onSave?: () => void
  isSaving?: boolean
  refreshTitle?: string
}

export function PlaylistPageActions({
  onPlayAll,
  onShuffle,
  onRefresh,
  isRefreshing = false,
  onSave,
  isSaving = false,
  refreshTitle,
}: PlaylistPageActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button variant="default" size="default" onClick={onPlayAll}>
        <Play className="mr-2 h-4 w-4" />
        {t('generic.playAll')}
      </Button>
      <Button variant="outline" size="default" onClick={onShuffle}>
        <Shuffle className="mr-2 h-4 w-4" />
        {t('generic.shuffle')}
      </Button>
      <Button
        variant="outline"
        size="default"
        onClick={onRefresh}
        disabled={isRefreshing}
        title={refreshTitle ?? t('generic.refresh')}
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
        />
      </Button>
      {onSave && (
        <Button
          variant="outline"
          size="default"
          onClick={onSave}
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? t('generic.saving') : t('generic.saveAsPlaylist')}
        </Button>
      )}
    </div>
  )
}
