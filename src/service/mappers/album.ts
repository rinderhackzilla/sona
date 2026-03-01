import { Albums } from '@/types/responses/album'

export function normalizeAlbum(album: Albums): Albums {
  return {
    ...album,
    name: (album.name ?? '').trim(),
    artist: (album.artist ?? '').trim(),
    coverArt: album.coverArt ?? '',
    genre: album.genre ?? '',
    songCount: Number.isFinite(album.songCount) ? album.songCount : 0,
    duration: Number.isFinite(album.duration) ? album.duration : 0,
  }
}

export function normalizeAlbums(albums: Albums[]) {
  return albums.map(normalizeAlbum)
}
