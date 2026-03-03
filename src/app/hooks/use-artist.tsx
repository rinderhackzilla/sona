import { useQuery } from '@tanstack/react-query'
import { subsonic } from '@/service/subsonic'
import { dedupeAlbumsByIdentity } from '@/utils/albumDedup'
import { queryKeys } from '@/utils/queryKeys'

export const useGetArtist = (artistId: string) => {
  return useQuery({
    queryKey: [queryKeys.artist.single, artistId],
    queryFn: async () => {
      const artist = await subsonic.artists.getOne(artistId)
      if (!artist?.album) return artist

      const dedupedAlbums = dedupeAlbumsByIdentity(artist.album)
      return {
        ...artist,
        album: dedupedAlbums,
        albumCount: dedupedAlbums.length,
      }
    },
    enabled: !!artistId,
  })
}

export const useGetArtists = () => {
  return useQuery({
    queryKey: [queryKeys.artist.all],
    queryFn: subsonic.artists.getAll,
  })
}

export const useGetArtistInfo = (artistId: string) => {
  return useQuery({
    queryKey: [queryKeys.artist.info, artistId],
    queryFn: () => subsonic.artists.getInfo(artistId),
    enabled: !!artistId,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: 'always',
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })
}

export const useGetTopSongs = (artistName?: string) => {
  return useQuery({
    queryKey: [queryKeys.artist.topSongs, artistName],
    queryFn: async () =>
      (await subsonic.songs.getTopSongs(artistName ?? '')) ?? [],
    enabled: !!artistName,
  })
}
