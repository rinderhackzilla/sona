import { AlbumListParams } from '@/service/albums'
import { normalizeAlbums } from '@/service/mappers/album'
import { subsonic } from '@/service/subsonic'
import { dedupeAlbumsByIdentity } from '@/utils/albumDedup'

const emptyResponse = { albums: [], nextOffset: null, albumsCount: 0 }

export async function getArtistDiscography(artistId: string) {
  const response = await subsonic.artists.getOne(artistId)

  if (!response || !response.album) return emptyResponse
  const albums = dedupeAlbumsByIdentity(normalizeAlbums(response.album))

  return {
    albums,
    nextOffset: null,
    albumsCount: albums.length,
  }
}

interface AlbumSearch {
  query: string
  count: number
  offset: number
}

export async function albumSearch({ query, count, offset }: AlbumSearch) {
  const response = await subsonic.search.get({
    query,
    songCount: 0,
    artistCount: 0,
    albumCount: count,
    albumOffset: offset,
  })

  if (!response) return emptyResponse
  if (!response.album) return emptyResponse
  const albums = dedupeAlbumsByIdentity(normalizeAlbums(response.album))

  let nextOffset: number | null = null
  if (albums.length >= count) {
    nextOffset = offset + count
  }

  return {
    albums,
    nextOffset,
    albumsCount: offset + albums.length,
  }
}

export async function getAlbumList(params: Required<AlbumListParams>) {
  const response = await subsonic.albums.getAlbumList(params)

  if (!response) return emptyResponse
  if (!response.list) return emptyResponse
  const albums = dedupeAlbumsByIdentity(normalizeAlbums(response.list))

  let nextOffset: number | null = null
  if (albums.length >= params.size) {
    nextOffset = params.offset + params.size
  }

  return {
    albums,
    nextOffset,
    albumsCount: response.albumsCount || albums.length,
  }
}
