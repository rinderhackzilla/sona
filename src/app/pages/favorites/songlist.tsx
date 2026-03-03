import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ShadowHeader } from '@/app/components/album/shadow-header'
import { InfinitySongListFallback } from '@/app/components/fallbacks/song-fallbacks'
import { HeaderTitle } from '@/app/components/header-title'
import { DataTableList } from '@/app/components/ui/data-table-list'
import { PageState } from '@/app/components/ui/page-state'
import { useFavoriteSongs } from '@/app/hooks/use-favorite-songs'
import { songsColumns } from '@/app/tables/songs-columns'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'

export default function SongList() {
  const { t } = useTranslation()
  const columns = songsColumns()
  const { setSongList } = usePlayerActions()

  const { data, isLoading } = useFavoriteSongs()

  if (isLoading) {
    return <InfinitySongListFallback />
  }
  if (!data) return null

  const songlist = data.songs
  const songCount = data.songs.length

  function handlePlaySong(index: number) {
    if (songlist) setSongList(songlist, index)
  }

  const columnsToShow: ColumnFilter[] = [
    'index',
    'title',
    'album',
    'duration',
    'playCount',
    'played',
    'contentType',
    'select',
  ]

  const title = t('sidebar.favorites')

  return (
    <div className="w-full h-content">
      <ShadowHeader
        showGlassEffect={false}
        fixed={false}
        className="relative w-full justify-between items-center"
      >
        <div className="flex gap-3 items-center">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <HeaderTitle title={title} count={songCount} loading={isLoading} />
        </div>
      </ShadowHeader>

      <div className="w-full h-[calc(100%-80px)] overflow-auto">
        {songlist.length === 0 ? (
          <PageState
            title={t('states.empty.title')}
            description={t('favorites.noSongList')}
            className="min-h-[280px]"
          />
        ) : (
          <DataTableList
            columns={columns}
            data={songlist}
            handlePlaySong={(row) => handlePlaySong(row.index)}
            columnFilter={columnsToShow}
            noRowsMessage={t('favorites.noSongList')}
            enableSorting={true}
          />
        )}
      </div>
    </div>
  )
}
