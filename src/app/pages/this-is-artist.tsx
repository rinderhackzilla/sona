import { useTranslation } from 'react-i18next'
import ImageHeader from '@/app/components/album/image-header'
import ListWrapper from '@/app/components/list-wrapper'
import { PlaylistPageActions } from '@/app/components/playlist/page-actions'
import { DataTable } from '@/app/components/ui/data-table'
import { PageLoading, PageState } from '@/app/components/ui/page-state'
import { useThisIsArtist } from '@/app/hooks/use-this-is-artist'
import { songsColumns } from '@/app/tables/songs-columns'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'

export default function ThisIsArtistPage() {
  const columns = songsColumns()
  const { t } = useTranslation()
  const { playlist, artist, isGenerating, error, generate, isConfigured } =
    useThisIsArtist()
  const { setSongList } = usePlayerActions()

  if (!isConfigured) {
    return (
      <PageState
        title={t('home.thisIsArtist')}
        description={t('home.configureLastfm')}
      />
    )
  }

  if (error) {
    return (
      <PageState
        variant="error"
        title={t('states.error.title')}
        description={error}
        actionLabel={t('states.error.retry')}
        onAction={generate}
      />
    )
  }

  if (isGenerating) {
    return <PageLoading label={t('home.generating')} />
  }

  if (playlist.length === 0 || !artist) {
    return (
      <PageState
        title={t('home.thisIsArtist')}
        description={t('home.generatePlaylist')}
        actionLabel={t('home.generate')}
        onAction={generate}
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

  const badges = [
    {
      content: t('playlist.songCount', { count: playlist.length }),
      type: 'text' as const,
    },
    { content: duration, type: 'text' as const },
  ]

  const handlePlayAll = () => {
    setSongList(playlist, 0)
  }

  const handlePlayShuffle = () => {
    const shuffled = [...playlist].sort(() => Math.random() - 0.5)
    setSongList(shuffled, 0)
  }

  return (
    <div className="w-full">
      <ImageHeader
        type={t('home.thisIsPrefix')}
        title={artist.name}
        subtitle={t('home.thisIsArtist')}
        coverArtId={artist.coverArt}
        coverArtType="artist"
        coverArtSize="700"
        coverArtAlt={artist.name}
        badges={badges}
        isPlaylist
      />

      <ListWrapper>
        <PlaylistPageActions
          onPlayAll={handlePlayAll}
          onShuffle={handlePlayShuffle}
          onRefresh={generate}
          isRefreshing={isGenerating}
        />

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
