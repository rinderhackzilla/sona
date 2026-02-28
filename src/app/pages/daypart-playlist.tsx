import { Clock3, Play, RefreshCw, Shuffle } from 'lucide-react'
import { startTransition } from 'react'
import { useTranslation } from 'react-i18next'
import ImageHeader from '@/app/components/album/image-header'
import ListWrapper from '@/app/components/list-wrapper'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { DataTable } from '@/app/components/ui/data-table'
import { useTimeOfDayPlaylist } from '@/app/hooks/use-time-of-day-playlist'
import { songsColumns } from '@/app/tables/songs-columns'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { BadgesData } from '@/app/components/header-info'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'
import { getDaypartMoodKey, getDaypartNameKey } from '@/utils/daypart'

export default function DaypartPlaylistPage() {
  const { t } = useTranslation()
  const columns = songsColumns()
  const { playlist, dayPart, generatedAt, genresUsed, isGenerating, error, generate } =
    useTimeOfDayPlaylist()
  const { setSongList } = usePlayerActions()

  if (error) {
    return (
      <div className="w-full px-8 py-6">
        <Card className="mx-auto mt-12 max-w-2xl border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('generic.error')}</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isGenerating && playlist.length === 0) {
    return (
      <div className="w-full px-8 py-6">
        <div className="mt-12 flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-lg">{t('home.generating')}</span>
        </div>
      </div>
    )
  }

  if (playlist.length === 0) {
    return (
      <div className="w-full px-8 py-6">
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <Clock3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-4 text-2xl font-semibold">Daypart Playlist</h2>
          <p className="mb-6 text-muted-foreground">No songs yet for this time window.</p>
          <Button size="lg" onClick={() => generate(true)} disabled={isGenerating}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('home.generate')}
          </Button>
        </div>
      </div>
    )
  }

  const columnsToShow: ColumnFilter[] = ['index', 'title', 'album', 'duration', 'select']

  const totalDuration = playlist.reduce((acc, song) => acc + song.duration, 0)
  const duration = convertSecondsToHumanRead(totalDuration)
  const title = t(getDaypartNameKey(dayPart))
  const mood = t(getDaypartMoodKey(dayPart))
  const genresLine =
    genresUsed.length > 0
      ? t('home.daypart.usedGenres', { genres: genresUsed.slice(0, 5).join(' • ') })
      : ''
  const subtitle = generatedAt
    ? `${mood} · ${new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : mood

  const badges: BadgesData = [
    { content: t('playlist.songCount', { count: playlist.length }), type: 'text' },
    { content: duration, type: 'text' },
    { content: genresUsed.slice(0, 3).join(' • ') || dayPart, type: 'text' },
  ]

  const handlePlayAll = () => {
    startTransition(() => {
      setSongList(playlist, 0)
    })
  }

  const handlePlayShuffle = () => {
    const shuffled = [...playlist].sort(() => Math.random() - 0.5)
    startTransition(() => {
      setSongList(shuffled, 0)
    })
  }

  return (
    <div className="w-full">
      <ImageHeader
        type={t('home.daypart.label')}
        title={title}
        subtitle={subtitle}
        coverArtId={playlist[0]?.coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt={title}
        badges={badges}
        isPlaylist
      />

      <ListWrapper>
        <div className="mb-4 flex gap-2">
          <Button variant="default" size="default" onClick={handlePlayAll}>
            <Play className="mr-2 h-4 w-4" />
            {t('generic.playAll')}
          </Button>
          <Button variant="outline" size="default" onClick={handlePlayShuffle}>
            <Shuffle className="mr-2 h-4 w-4" />
            {t('generic.shuffle')}
          </Button>
          <Button variant="outline" size="default" onClick={() => generate(true)} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={playlist}
          handlePlaySong={(row) =>
            startTransition(() => {
              setSongList(playlist, row.index)
            })
          }
          columnFilter={columnsToShow}
          noRowsMessage={t('discoverWeekly.noSongs')}
          variant="modern"
        />
        {genresLine && (
          <p className="mt-3 text-xs text-muted-foreground/80">{genresLine}</p>
        )}
      </ListWrapper>
    </div>
  )
}
