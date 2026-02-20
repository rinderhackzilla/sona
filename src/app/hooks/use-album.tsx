import { useQuery } from '@tanstack/react-query'
import { subsonic } from '@/service/subsonic'
import { queryKeys } from '@/utils/queryKeys'

export const useGetAlbum = (albumId: string) => {
  return useQuery({
    queryKey: [queryKeys.album.single, albumId],
    queryFn: async () => {
      const data = await subsonic.albums.getOne(albumId)
      if (!data) throw new Error('Album not found')
      return data
    },
  })
}

export const useGetAlbumInfo = (albumId: string) => {
  return useQuery({
    queryKey: [queryKeys.album.info, albumId],
    queryFn: async () => {
      const data = await subsonic.albums.getInfo(albumId)
      if (!data) throw new Error('Album info not found')
      return data
    },
    enabled: !!albumId,
  })
}

export const useGetArtistAlbums = (artistId: string) => {
  return useQuery({
    queryKey: [queryKeys.album.moreAlbums, artistId],
    queryFn: () => subsonic.artists.getOne(artistId),
    enabled: !!artistId,
  })
}

export const useGetGenreAlbums = (genre: string) => {
  return useQuery({
    queryKey: [queryKeys.album.genreAlbums, genre],
    queryFn: () =>
      subsonic.albums.getAlbumList({
        type: 'byGenre',
        genre,
        size: 16,
      }),
    enabled: !!genre,
  })
}
