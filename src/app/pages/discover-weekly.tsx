import { useTranslation } from 'react-i18next'
import { RefreshCw, Sparkles, Info } from 'lucide-react'
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

export default function DiscoverWeeklyPage() {
  const { t } = useTranslation()
  const columns = songsColumns()
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

  const columnsToShow: ColumnFilter[] = [
    'index',
    'title',
    'album',
    'duration',
    'select',
  ]

  const hasSongs = playlist.length > 0
  const totalDuration = playlist.reduce((acc, song) => acc + song.duration, 0)
  const duration = convertSecondsToHumanRead(totalDuration)

  const songCount = hasSongs
    ? t('playlist.songCount', { count: playlist.length })
    : null
  const playlistDuration = hasSongs
    ? t('playlist.duration', { duration })
    : null

  const lastUpdated = lastGenerated
    ? new Date(lastGenerated).toLocaleDateString()
    : null

  const artistsCount = artistsUsed.length > 0
    ? `${artistsUsed.length} ${t('artist.pluralHeadline').toLowerCase()}`
    : null

  const badges: BadgesData = [
    { content: songCount, type: 'text' },
    { content: playlistDuration, type: 'text' },
    { content: artistsCount, type: 'text' },
    { content: lastUpdated ? `Updated ${lastUpdated}` : null, type: 'text' },
  ]

  // Use first song's cover art as playlist cover
  const coverArt = playlist.length > 0 ? playlist[0].coverArt : undefined

  return (
    <div className="w-full">
      <ImageHeader
        type="Personalized Playlist"
        title={`Discover Weekly${weekKey ? ` • ${weekKey}` : ''}`}
        subtitle="Your personalized mix based on Last.fm listening history"
        coverArtId={coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt="Discover Weekly"
        badges={badges}
        isPlaylist={true}
      />

      <ListWrapper>
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="default"
            onClick={generate}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Playlist
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={playlist}
          handlePlaySong={(row) => setSongList(playlist, row.index)}
          columnFilter={columnsToShow}
          noRowsMessage="No songs in your Discover Weekly yet"
          variant="modern"
        />
      </ListWrapper>
    </div>
  )
}
