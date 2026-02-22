import { useQuery } from '@tanstack/react-query'
import { subsonic } from '@/service/subsonic'
import { queryKeys } from '@/utils/queryKeys'

export const useGetAlbum = (albumId: string) => {
  return useQuery({
    queryKey: [queryKeys.album.single, albumId],
    queryFn: async () => {
      const candidates = Array.from(
        new Set([
          albumId,
          safeDecodeURIComponent(albumId),
          safeDecodeURIComponent(safeDecodeURIComponent(albumId)),
          safeEncodeURIComponent(albumId),
        ].filter(Boolean)),
      )

      for (const candidate of candidates) {
        const data = await subsonic.albums.getOne(candidate)
        if (data) return data
      }

      throw new Error('Album not found')
    },
  })
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function safeEncodeURIComponent(value: string) {
  try {
    return encodeURIComponent(value)
  } catch {
    return value
  }
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
