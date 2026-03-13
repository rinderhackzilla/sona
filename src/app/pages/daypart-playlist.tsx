import { Clock3 } from 'lucide-react'
import { startTransition } from 'react'
import { useTranslation } from 'react-i18next'
import ImageHeader from '@/app/components/album/image-header'
import { BadgesData } from '@/app/components/header-info'
import ListWrapper from '@/app/components/list-wrapper'
import { PlaylistPageActions } from '@/app/components/playlist/page-actions'
import { DataTable } from '@/app/components/ui/data-table'
import { PageLoading, PageState } from '@/app/components/ui/page-state'
import { useTimeOfDayPlaylist } from '@/app/hooks/use-time-of-day-playlist'
import { songsColumns } from '@/app/tables/songs-columns'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'
import { getDaypartMoodKey, getDaypartNameKey } from '@/utils/daypart'
import { shuffleSongList } from '@/utils/songListFunctions'

export default function DaypartPlaylistPage() {
  const { t } = useTranslation()
  const columns = songsColumns()
  const {
    playlist,
    dayPart,
    generatedAt,
    genresUsed,
    isGenerating,
    error,
    generate,
  } = useTimeOfDayPlaylist()
  const { setSongList } = usePlayerActions()

  if (error) {
    return (
      <PageState
        variant="error"
        title={t('states.error.title')}
        description={error}
        actionLabel={t('states.error.retry')}
        onAction={() => generate(true)}
      />
    )
  }

  if (isGenerating && playlist.length === 0) {
    return <PageLoading label={t('home.generating')} />
  }

  if (playlist.length === 0) {
    return (
      <PageState
        title={t('home.daypart.label')}
        description={t('states.empty.daypartDescription')}
        icon={<Clock3 className="h-5 w-5 text-muted-foreground" />}
        actionLabel={t('home.generate')}
        onAction={() => generate(true)}
      />
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
  const title = t(getDaypartNameKey(dayPart))
  const mood = t(getDaypartMoodKey(dayPart))
  const genresLine =
    genresUsed.length > 0
      ? t('home.daypart.usedGenres', {
          genres: genresUsed.slice(0, 5).join(' • '),
        })
      : ''
  const subtitle = generatedAt
    ? `${mood} · ${new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : mood

  const badges: BadgesData = [
    {
      content: t('playlist.songCount', { count: playlist.length }),
      type: 'text',
    },
    { content: duration, type: 'text' },
    { content: genresUsed.slice(0, 3).join(' • ') || dayPart, type: 'text' },
  ]

  const handlePlayAll = () => {
    startTransition(() => {
      setSongList(playlist, 0)
    })
  }

  const handlePlayShuffle = () => {
    const shuffled = shuffleSongList(playlist, 0, true)
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
        <PlaylistPageActions
          onPlayAll={handlePlayAll}
          onShuffle={handlePlayShuffle}
          onRefresh={() => generate(true)}
          isRefreshing={isGenerating}
        />

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
