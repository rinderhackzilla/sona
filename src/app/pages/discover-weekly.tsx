import { RefreshCw, Sparkles, Info } from 'lucide-react'
import { CoverMosaic } from '@/app/components/discover-weekly/cover-mosaic'
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

  const songCount = `${playlist.length} ${playlist.length === 1 ? 'song' : 'songs'}`
  const artistsCount = artistsUsed.length > 0 ? `${artistsUsed.length} artists` : null

  const lastUpdated = lastGenerated
    ? new Date(lastGenerated).toLocaleDateString()
    : null

  const badges: BadgesData = [
    { content: songCount, type: 'text' },
    { content: duration, type: 'text' },
    { content: artistsCount, type: 'text' },
    { content: lastUpdated ? `Updated ${lastUpdated}` : null, type: 'text' },
  ]

  return (
    <div className="w-full">
      {/* Custom Header with Mosaic Cover */}
      <div className="relative w-full">
        <div className="flex flex-col md:flex-row gap-6 p-8 pb-6">
          {/* Mosaic Cover */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-lg overflow-hidden shadow-2xl">
              <CoverMosaic songs={playlist} size={256} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Personalized Playlist</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Discover Weekly
            </h1>

            {weekKey && (
              <p className="text-sm text-muted-foreground mb-4">
                Week of {weekKey}
              </p>
            )}

            <p className="text-base text-muted-foreground mb-6">
              Your personalized mix based on Last.fm listening history
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                badge.content && (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                  >
                    {badge.content}
                  </span>
                )
              ))}
            </div>
          </div>
        </div>
      </div>

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
