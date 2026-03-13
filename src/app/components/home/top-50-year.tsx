import { Info, Play, RefreshCw, Shuffle, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { useTop50Year } from '@/app/hooks/use-top-50-year'
import { usePlayerActions } from '@/store/player.store'
import { shuffleSongList } from '@/utils/songListFunctions'

export function Top50Year() {
  const { t } = useTranslation()
  const {
    playlist,
    totalTracks,
    isGenerating,
    error,
    lastGenerated,
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
                  {t('top50.setupTitle')}
                </CardTitle>
                <CardDescription>
                  {t('top50.setupDescription')}
                  <br />
                  <strong>{t('top50.setupPrefix')}</strong>{' '}
                  {t('top50.setupInstructions')}
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
              {t('states.error.title')}: {error}
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
          <span>{t('top50.generatingPlaylist')}</span>
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
            {t('top50.headerTitle')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate()}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('top50.generatePlaylist')}
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
    const shuffled = shuffleSongList(playlist, 0, true)
    setSongList(shuffled, 0)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('top50.headerTitle')}
          </h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('top50.updated', { date: lastUpdated })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={handlePlayAll}>
            <Play className="h-4 w-4 mr-2" />
            {t('generic.playAll')}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePlayShuffle}>
            <Shuffle className="h-4 w-4 mr-2" />
            {t('generic.shuffle')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generate()}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('generic.refresh')}
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            {t('playlist.songCount', { count: totalTracks })}
          </p>
          <div className="space-y-2">
            {playlist.slice(0, 10).map((song, index) => (
              <div
                key={song.id}
                className="flex cursor-pointer items-center gap-3 rounded p-2 transition-colors hover:bg-accent/70"
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
              + {t('generic.moreSongs', { count: playlist.length - 10 })}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
