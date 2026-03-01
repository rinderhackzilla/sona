import { redirect } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { AlbumListType } from '@/types/responses/album'
import {
  AlbumsFilters,
  AlbumsSearchParams,
  PersistedAlbumListKeys,
  YearFilter,
  YearSortOptions,
} from '@/utils/albumsFilter'
import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'
import { SearchParamsHandler } from '@/utils/searchParamsHandler'

export function handleYearFilterRedirection(searchParams: URLSearchParams) {
  const { getSearchParam } = new SearchParamsHandler(searchParams)

  const persistedYear = safeStorageGet(
    PersistedAlbumListKeys.YearFilter,
  ) as YearFilter | null

  const persistedMainFilter = safeStorageGet(
    PersistedAlbumListKeys.MainFilter,
  ) as AlbumListType | null

  const isByYearFilter = persistedMainFilter === AlbumsFilters.ByYear
  const hasYearFilter = searchParams.has(AlbumsSearchParams.YearFilter)

  if (persistedYear && !hasYearFilter && isByYearFilter) {
    return redirect(ROUTES.ALBUMS.YEAR(persistedYear))
  }

  if (hasYearFilter) {
    const yearFilter = getSearchParam<YearFilter>(
      AlbumsSearchParams.YearFilter,
      YearSortOptions.Oldest,
    )

    safeStorageSet(PersistedAlbumListKeys.YearFilter, yearFilter)
  }

  return null
}
