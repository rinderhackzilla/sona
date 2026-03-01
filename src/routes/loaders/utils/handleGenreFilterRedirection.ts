import { redirect } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { AlbumListType } from '@/types/responses/album'
import {
  AlbumsFilters,
  AlbumsSearchParams,
  PersistedAlbumListKeys,
} from '@/utils/albumsFilter'
import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'
import { SearchParamsHandler } from '@/utils/searchParamsHandler'

export function handleGenreFilterRedirection(searchParams: URLSearchParams) {
  const { getSearchParam } = new SearchParamsHandler(searchParams)

  const savedGenre = safeStorageGet(PersistedAlbumListKeys.GenreFilter)
  const persistedMainFilter = safeStorageGet(
    PersistedAlbumListKeys.MainFilter,
  ) as AlbumListType | null

  const isByGenreFilter = persistedMainFilter === AlbumsFilters.ByGenre

  const hasMainFilter = searchParams.has(AlbumsSearchParams.MainFilter)
  const hasGenreFilter = searchParams.has(AlbumsSearchParams.Genre)

  if (savedGenre && !hasMainFilter && !hasGenreFilter && isByGenreFilter) {
    return redirect(ROUTES.ALBUMS.GENRE(savedGenre))
  }

  if (hasGenreFilter) {
    const genre = getSearchParam<string>(AlbumsSearchParams.Genre, '')

    safeStorageSet(PersistedAlbumListKeys.GenreFilter, genre)
  }

  return null
}
