import { RefreshCw, Sparkles, Info, Play, Shuffle, Save } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ImageHeader from '@/app/components/album/image-header'
import { BadgesData } from '@/app/components/header-info'
import ListWrapper from '@/app/components/list-wrapper'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { DataTable } from '@/app/components/ui/data-table'
import { useDiscoverWeekly } from '@/app/hooks/use-discover-weekly'
import { songsColumns } from '@/app/tables/songs-columns'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'
import { exportPlaylist } from '@/service/export-playlist'
import { toast } from 'react-toastify'

export default function DiscoverWeeklyPage() {
  const columns = songsColumns()
  const { t } = useTranslation()
  const {
    playlist,
    isGenerating,
    error,
    lastGenerated,
    artistsUsed,
    weekKey,
    generate,
    isConfigured,
  } = useDiscoverWeekly()
  const { setSongList } = usePlayerActions()
  const [isSaving, setIsSaving] = useState(false)

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
                  {t('discoverWeekly.setupTitle')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('discoverWeekly.setupDescription')}
                  <br />
                  <br />
                  <strong>{t('discoverWeekly.setupPrefix')}</strong> {t('discoverWeekly.setupInstructions')}
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
            <CardTitle className="text-destructive">{t('generic.error')}</CardTitle>
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
          <span className="text-lg">{t('discoverWeekly.generatingPlaylist')}</span>
        </div>
      </div>
    )
  }

  if (playlist.length === 0) {
    return (
      <div className="w-full px-8 py-6">
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-4">{t('discoverWeekly.emptyTitle')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('discoverWeekly.emptyDescription')}
          </p>
          <Button
            size="lg"
            onClick={generate}
            disabled={isGenerating}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t('discoverWeekly.generatePlaylist')}
          </Button>
        </div>
      </div>
    )
  }

  const columnsToShow: ColumnFilter[] = [
    'index',
    'title',
    'album',
    'duration',
    'select',
  ]

  const totalDuration = playlist.reduce((acc, song) => acc + song.duration, 0)
  const duration = convertSecondsToHumanRead(totalDuration)

  const songCount = t('playlist.songCount', { count: playlist.length })
  const artistsCount = artistsUsed.length > 0
    ? t('discoverWeekly.artistCount', { count: artistsUsed.length })
    : null

  const lastUpdated = lastGenerated
    ? new Date(lastGenerated).toLocaleDateString()
    : null

  const badges: BadgesData = [
    { content: songCount, type: 'text' },
    { content: duration, type: 'text' },
    { content: artistsCount, type: 'text' },
    { content: lastUpdated ? t('discoverWeekly.updated', { date: lastUpdated }) : null, type: 'text' },
  ]

  const handlePlayAll = () => {
    setSongList(playlist, 0)
  }

  const handlePlayShuffle = () => {
    const shuffled = [...playlist].sort(() => Math.random() - 0.5)
    setSongList(shuffled, 0)
  }

const handleSaveAsPlaylist = async () => {
  setIsSaving(true)
  try {
    const playlistName = `Discover Weekly ${weekKey || new Date().toISOString().split('T')[0]}`
    await exportPlaylist({
      name: playlistName,
      songs: playlist,
      comment: `Generated on ${lastUpdated || new Date().toLocaleDateString()} with ${artistsUsed.length} artists`,
      isPublic: false,
    })
    toast.success(t('discoverWeekly.savedSuccess', { name: playlistName }))
  } catch (error) {
    console.error('[Discover Weekly] Save failed:', error)
    toast.error(t('discoverWeekly.saveError', { message: error instanceof Error ? error.message : 'Unknown error' }))
  } finally {
    setIsSaving(false)
  }
}
  // Use first song's cover art as playlist cover
  const coverArt = playlist.length > 0 ? playlist[0].coverArt : undefined

  return (
    <div className="w-full">
      <ImageHeader
        type={t('discoverWeekly.headerType')}
        title={t('discoverWeekly.emptyTitle')}
        subtitle={t('discoverWeekly.headerSubtitle')}
        coverArtId={coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt={t('discoverWeekly.emptyTitle')}
        badges={badges}
        isPlaylist={true}
      />

      <ListWrapper>
        <div className="flex gap-2 mb-4">
          <Button
            variant="default"
            size="default"
            onClick={handlePlayAll}
          >
            <Play className="h-4 w-4 mr-2" />
            {t('generic.playAll')}
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={handlePlayShuffle}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            {t('generic.shuffle')}
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={generate}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={handleSaveAsPlaylist}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('generic.saving') : t('generic.saveAsPlaylist')}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={playlist}
          handlePlaySong={(row) => setSongList(playlist, row.index)}
          columnFilter={columnsToShow}
          noRowsMessage={t('discoverWeekly.noSongs')}
          variant="modern"
        />
      </ListWrapper>
    </div>
  )
}
