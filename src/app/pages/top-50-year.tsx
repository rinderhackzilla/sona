import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import ImageHeader from '@/app/components/album/image-header'
import { BadgesData } from '@/app/components/header-info'
import ListWrapper from '@/app/components/list-wrapper'
import { PlaylistPageActions } from '@/app/components/playlist/page-actions'
import { DataTable } from '@/app/components/ui/data-table'
import { PageLoading, PageState } from '@/app/components/ui/page-state'
import { useTop50Year } from '@/app/hooks/use-top-50-year'
import { songsColumns } from '@/app/tables/songs-columns'
import { exportPlaylist } from '@/service/export-playlist'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'
import { shuffleSongList } from '@/utils/songListFunctions'

export default function Top50YearPage() {
  const columns = songsColumns()
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
  const [isSaving, setIsSaving] = useState(false)

  if (!isConfigured) {
    return (
      <PageState
        title={t('top50.setupTitle')}
        description={`${t('top50.setupDescription')} ${t('top50.setupInstructions')}`}
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
        onAction={() => generate()}
      />
    )
  }

  if (isGenerating) {
    return <PageLoading label={t('top50.generatingPlaylist')} />
  }

  if (playlist.length === 0) {
    return (
      <PageState
        title={t('top50.emptyTitle')}
        description={t('top50.emptyDescription')}
        actionLabel={t('top50.generatePlaylist')}
        onAction={() => generate()}
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

  const songCount = t('playlist.songCount', { count: totalTracks })

  const lastUpdated = lastGenerated
    ? new Date(lastGenerated).toLocaleDateString()
    : null

  const badges: BadgesData = [
    { content: songCount, type: 'text' },
    { content: duration, type: 'text' },
    {
      content: lastUpdated ? t('top50.updated', { date: lastUpdated }) : null,
      type: 'text',
    },
  ]

  const handlePlayAll = () => {
    setSongList(playlist, 0)
  }

  const handlePlayShuffle = () => {
    const shuffled = shuffleSongList(playlist, 0, true)
    setSongList(shuffled, 0)
  }

  const handleSaveAsPlaylist = async () => {
    setIsSaving(true)
    try {
      const playlistName = `Your Top 50`
      await exportPlaylist({
        name: playlistName,
        songs: playlist,
        comment: `Your top ${totalTracks} most played tracks. Generated on ${lastUpdated || new Date().toLocaleDateString()}`,
        isPublic: false,
      })
      toast.success(t('top50.savedSuccess', { name: playlistName }))
    } catch (error) {
      console.error('[Your Top 50] Save failed:', error)
      toast.error(
        t('top50.saveError', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Use first song's cover art as playlist cover
  const coverArt = playlist.length > 0 ? playlist[0].coverArt : undefined

  return (
    <div className="w-full">
      <ImageHeader
        type={t('top50.headerType')}
        title={t('top50.headerTitle')}
        subtitle={t('top50.headerSubtitle')}
        coverArtId={coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt={t('top50.headerTitle')}
        badges={badges}
        isPlaylist={true}
      />

      <ListWrapper>
        <PlaylistPageActions
          onPlayAll={handlePlayAll}
          onShuffle={handlePlayShuffle}
          onRefresh={() => generate()}
          isRefreshing={isGenerating}
          onSave={handleSaveAsPlaylist}
          isSaving={isSaving}
        />

        <DataTable
          columns={columns}
          data={playlist}
          handlePlaySong={(row) => setSongList(playlist, row.index)}
          columnFilter={columnsToShow}
          noRowsMessage={t('top50.noSongs')}
          variant="modern"
        />
      </ListWrapper>
    </div>
  )
}
