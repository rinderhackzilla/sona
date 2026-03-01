import { redirect } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'
import { AlbumListType } from '@/types/responses/album'
import {
  AlbumsSearchParams,
  PersistedAlbumListKeys,
} from '@/utils/albumsFilter'
import { safeStorageGet } from '@/utils/safe-storage'

export function handleMainFilterRedirection(searchParams: URLSearchParams) {
  const savedFilter = safeStorageGet(
    PersistedAlbumListKeys.MainFilter,
  ) as AlbumListType | null

  const hasMainFilter = searchParams.has(AlbumsSearchParams.MainFilter)

  if (savedFilter && !hasMainFilter) {
    return redirect(ROUTES.ALBUMS.GENERIC(savedFilter))
  }

  return null
}
