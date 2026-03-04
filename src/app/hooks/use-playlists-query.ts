import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { filterPlaylistsByAutoImportPreference } from '@/service/playlists'
import { subsonic } from '@/service/subsonic'
import { useAppData, useAppPages } from '@/store/app.store'
import { queryKeys } from '@/utils/queryKeys'

export function usePlaylistsQuery() {
  const { serverType } = useAppData()
  const { autoPlaylistImport, autoPlaylistImportExceptions } = useAppPages()

  const query = useQuery({
    queryKey: [queryKeys.playlist.all],
    queryFn: subsonic.playlists.getAll,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
  })

  const filteredData = useMemo(() => {
    const playlists = query.data ?? []
    return filterPlaylistsByAutoImportPreference(playlists, {
      isNavidrome: serverType === 'navidrome',
      autoPlaylistImport,
      autoPlaylistImportExceptions,
    })
  }, [autoPlaylistImport, autoPlaylistImportExceptions, query.data, serverType])

  return {
    ...query,
    data: filteredData,
  }
}
