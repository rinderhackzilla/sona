import { useQuery } from '@tanstack/react-query'
import { subsonic } from '@/service/subsonic'
import {
  dedupeAlbumsByIdentity,
  getMergedAlbumIdsForRepresentative,
  mergeSingleAlbums,
} from '@/utils/albumDedup'
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
        if (!data) continue

        const relatedIds = new Set<string>([
          ...getMergedAlbumIdsForRepresentative(data.id),
          data.id,
        ])

        const normalize = (value?: string) =>
          (value ?? '')
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()

        // Fallback path for cases where album list dedupe has no registry entry:
        // find same-name albums under the same artist and merge them.
        if (data.artistId) {
          const artist = await subsonic.artists.getOne(data.artistId).catch(() => null)
          if (artist?.album) {
            const sourceName = normalize(data.name)
            const sameNameAlbums = artist.album.filter((album) => {
              if (!album?.id) return false
              return normalize(album.name) === sourceName
            })
            for (const album of sameNameAlbums) {
              relatedIds.add(album.id)
            }
          }
        }

        const relatedAlbums = await Promise.all(
          [...relatedIds].map((id) => subsonic.albums.getOne(id).catch(() => null)),
        )
        const existingAlbums = relatedAlbums.filter(Boolean)
        const merged = mergeSingleAlbums(existingAlbums)
        if (merged) return merged
        return data
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
    queryFn: async () => {
      const artist = await subsonic.artists.getOne(artistId)
      if (!artist?.album) return artist
      return {
        ...artist,
        album: dedupeAlbumsByIdentity(artist.album),
      }
    },
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
