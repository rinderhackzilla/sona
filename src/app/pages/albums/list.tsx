import { useMemo } from 'react'
import { AlbumGridCard } from '@/app/components/albums/album-grid-card'
import { EmptyAlbums } from '@/app/components/albums/empty-page'
import { AlbumsHeader } from '@/app/components/albums/header'
import { AlbumsFallback } from '@/app/components/fallbacks/album-fallbacks'
import { GridViewWrapper } from '@/app/components/grid-view-wrapper'
import ListWrapper from '@/app/components/list-wrapper'
import { dedupeAlbumsForDisplay } from '@/utils/albumDedup'
import { useAlbumsListModel } from './list.model'

export default function AlbumsList() {
  const { isLoading, isEmpty, albums, albumsCount } = useAlbumsListModel()
  const displayAlbums = useMemo(
    () => dedupeAlbumsForDisplay(albums),
    [albums],
  )
  const displayAlbumsCount = displayAlbums.length

  if (isLoading) return <AlbumsFallback />
  if (isEmpty || displayAlbumsCount === 0) return <EmptyAlbums />

  return (
    <div className="w-full h-full">
      <AlbumsHeader albumCount={Math.min(albumsCount, displayAlbumsCount)} />

      <ListWrapper className="px-0">
        <GridViewWrapper
          list={displayAlbums}
          data-testid="albums-grid"
          type="albums"
        >
          {(album) => <AlbumGridCard album={album} />}
        </GridViewWrapper>
      </ListWrapper>
    </div>
  )
}
