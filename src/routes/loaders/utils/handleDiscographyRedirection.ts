import { redirect } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import {
  AlbumsFilters,
  AlbumsSearchParams,
  PersistedAlbumListKeys,
} from '@/utils/albumsFilter'
import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'
import { SearchParamsHandler } from '@/utils/searchParamsHandler'

export function handleDiscographyRedirection(searchParams: URLSearchParams) {
  const { getSearchParam } = new SearchParamsHandler(searchParams)

  const hasMainFilter = searchParams.has(AlbumsSearchParams.MainFilter)
  const hasArtistNameFilter = searchParams.has(AlbumsSearchParams.ArtistName)
  const hasArtistIdFilter = searchParams.has(AlbumsSearchParams.ArtistId)

  const savedArtistName = safeStorageGet(
    PersistedAlbumListKeys.ArtistNameFilter,
  )
  const savedArtistId = safeStorageGet(
    PersistedAlbumListKeys.ArtistIdFilter,
  )
  const savedFilter = safeStorageGet(PersistedAlbumListKeys.MainFilter)

  const isDiscography = savedFilter === AlbumsFilters.ByDiscography
  const hasPersistedValues = savedArtistName && savedArtistId
  const hasArtistFilter = hasArtistNameFilter && hasArtistIdFilter

  if (
    hasPersistedValues &&
    !hasArtistFilter &&
    !hasMainFilter &&
    isDiscography
  ) {
    return redirect(ROUTES.ALBUMS.ARTIST(savedArtistId, savedArtistName))
  }

  if (hasArtistFilter) {
    const artistName = getSearchParam<string>(AlbumsSearchParams.ArtistName, '')
    const artistId = getSearchParam<string>(AlbumsSearchParams.ArtistId, '')

    safeStorageSet(
      PersistedAlbumListKeys.MainFilter,
      AlbumsFilters.ByDiscography,
    )
    safeStorageSet(PersistedAlbumListKeys.ArtistNameFilter, artistName)
    safeStorageSet(PersistedAlbumListKeys.ArtistIdFilter, artistId)
  }

  return null
}
