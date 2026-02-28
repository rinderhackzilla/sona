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

export const useGetArtistInfo = (artistId: string) => {
  return useQuery({
    queryKey: [queryKeys.artist.info, artistId],
    queryFn: () => subsonic.artists.getInfo(artistId),
    enabled: !!artistId,
  })
}

export const useGetTopSongs = (artistName?: string) => {
  return useQuery({
    queryKey: [queryKeys.artist.topSongs, artistName],
    queryFn: () => subsonic.songs.getTopSongs(artistName ?? ''),
    enabled: !!artistName,
  })
}
