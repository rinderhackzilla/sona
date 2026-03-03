import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import ImageHeader from '@/app/components/album/image-header'
import { PlaylistFallback } from '@/app/components/fallbacks/playlist-fallbacks'
import { BadgesData } from '@/app/components/header-info'
import ListWrapper from '@/app/components/list-wrapper'
import { PlaylistButtons } from '@/app/components/playlist/buttons'
import { RemoveSongFromPlaylistDialog } from '@/app/components/playlist/remove-song-dialog'
import { DataTable } from '@/app/components/ui/data-table'
import { PageState } from '@/app/components/ui/page-state'
import ErrorPage from '@/app/pages/error-page'
import { songsColumns } from '@/app/tables/songs-columns'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { PlaylistWithEntries } from '@/types/responses/playlist'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'
import { queryKeys } from '@/utils/queryKeys'

export default function Playlist() {
  const { playlistId } = useParams() as { playlistId: string }
  const { t } = useTranslation()
  const columns = songsColumns({ showHeartInSelect: false })
  const { setSongList } = usePlayerActions()
  const queryClient = useQueryClient()

  const {
    data: playlist,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [queryKeys.playlist.single, playlistId],
    queryFn: () => subsonic.playlists.getOne(playlistId),
  })

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!playlist?.entry) return

      const newEntries = [...playlist.entry]
      const [moved] = newEntries.splice(fromIndex, 1)
      newEntries.splice(toIndex, 0, moved)

      // Optimistic update
      queryClient.setQueryData(
        [queryKeys.playlist.single, playlistId],
        (old: PlaylistWithEntries | undefined) => {
          if (!old) return old
          return { ...old, entry: newEntries }
        },
      )

      // Persist to server
      try {
        await subsonic.playlists.reorderSongs(
          playlistId,
          newEntries.map((s) => s.id),
        )
      } catch {
        // Roll back on failure
        queryClient.invalidateQueries({
          queryKey: [queryKeys.playlist.single, playlistId],
        })
      }
    },
    [playlist, playlistId, queryClient],
  )

  if (isFetching || isLoading) return <PlaylistFallback />
  if (!playlist) return <ErrorPage status={404} statusText="Not Found" />

  const columnsToShow: ColumnFilter[] = [
    'index',
    'starred',
    'title',
    // 'artist',
    'album',
    'duration',
    'playCount',
    'created',
    'contentType',
    'select',
  ]

  const hasSongs = playlist.songCount > 0
  const duration = convertSecondsToHumanRead(playlist.duration)

  const songCount = hasSongs
    ? t('playlist.songCount', { count: playlist.songCount })
    : null
  const playlistDuration = hasSongs
    ? t('playlist.duration', { duration })
    : null

  const badges: BadgesData = [
    { content: songCount, type: 'text' },
    {
      content: playlistDuration,
      type: 'text',
    },
  ]

  const coverArt = playlist.songCount > 0 ? playlist.coverArt : undefined

  return (
    <div className="w-full" key={playlist.id}>
      <ImageHeader
        type={t('playlist.headline')}
        title={playlist.name}
        subtitle={playlist.comment}
        coverArtId={coverArt}
        coverArtType="album"
        coverArtSize="700"
        coverArtAlt={playlist.name}
        badges={badges}
        isPlaylist={true}
      />

      <ListWrapper>
        <PlaylistButtons playlist={playlist} />

        <DataTable
          columns={columns}
          data={playlist.entry ?? []}
          handlePlaySong={(row) => setSongList(playlist.entry, row.index)}
          columnFilter={columnsToShow}
          noRowsMessage={t('states.empty.noTracks')}
          variant="modern"
          onReorder={handleReorder}
          enableSorting={true}
        />

        {(!playlist.entry || playlist.entry.length === 0) && (
          <PageState
            title={t('states.empty.title')}
            description={t('states.empty.playlistDescription')}
            className="min-h-[160px] px-0 py-2"
          />
        )}

        <RemoveSongFromPlaylistDialog />
      </ListWrapper>
    </div>
  )
}
