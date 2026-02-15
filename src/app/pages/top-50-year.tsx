import { RefreshCw, Trophy, Info, Play, Shuffle } from 'lucide-react'
import ImageHeader from '@/app/components/album/image-header'
import { BadgesData } from '@/app/components/header-info'
import ListWrapper from '@/app/components/list-wrapper'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { DataTable } from '@/app/components/ui/data-table'
import { useTop50Year } from '@/app/hooks/use-top-50-year'
import { songsColumns } from '@/app/tables/songs-columns'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'

export default function Top50YearPage() {
  const columns = songsColumns()
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
      <div className="w-full px-8 py-6">
        <Card className="border-dashed max-w-2xl mx-auto mt-12">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <CardTitle className="text-xl mb-3">
                  Setup Top 50 Year
                </CardTitle>
                <CardDescription className="text-base">
                  Get your top 50 most played tracks from the last 12 months based on your Last.fm listening history.
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
          <span className="text-lg">Generating your Top 50 playlist...</span>
        </div>
      </div>
    )
  }

  if (playlist.length === 0) {
    return (
      <div className="w-full px-8 py-6">
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-4">Top 50 of {year}</h2>
          <p className="text-muted-foreground mb-6">
            Your Top 50 playlist hasn't been generated yet.
          </p>
          <Button
            size="lg"
            onClick={() => generate()}
            disabled={isGenerating}
          >
            <Trophy className="h-4 w-4 mr-2" />
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

  const totalDuration = playlist.reduce((acc, song) => acc + song.duration, 0)
  const duration = convertSecondsToHumanRead(totalDuration)

  const songCount = `${totalTracks} ${totalTracks === 1 ? 'song' : 'songs'}`

  const lastUpdated = lastGenerated
    ? new Date(lastGenerated).toLocaleDateString()
    : null

  const badges: BadgesData = [
    { content: songCount, type: 'text' },
    { content: duration, type: 'text' },
    { content: `${year}`, type: 'text' },
    { content: lastUpdated ? `Updated ${lastUpdated}` : null, type: 'text' },
  ]

  const handlePlayAll = () => {
    setSongList(playlist, 0)
  }

  const handlePlayShuffle = () => {
    const shuffled = [...playlist].sort(() => Math.random() - 0.5)
    setSongList(shuffled, 0)
  }

  // Use first song's cover art as playlist cover
  const coverArt = playlist.length > 0 ? playlist[0].coverArt : undefined

  return (
    <div className="w-full">
      <ImageHeader
        type="Personalized Playlist"
        title={`Top 50 of ${year}`}
        subtitle="Your most played tracks from the last 12 months"
        coverArtId={coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt="Top 50 Year"
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
            onClick={() => generate()}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={playlist}
          handlePlaySong={(row) => setSongList(playlist, row.index)}
          columnFilter={columnsToShow}
          noRowsMessage="No songs in your Top 50 yet"
          variant="modern"
        />
      </ListWrapper>
    </div>
  )
}
