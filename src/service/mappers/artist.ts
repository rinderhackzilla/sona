import { ISimilarArtist } from '@/types/responses/artist'

export function normalizeSimilarArtist(artist: ISimilarArtist): ISimilarArtist {
  return {
    ...artist,
    name: (artist.name ?? '').trim(),
    albumCount: Number.isFinite(artist.albumCount) ? artist.albumCount : 0,
    coverArt: artist.coverArt ?? '',
    coverArtType: artist.coverArtType ?? 'artist',
    artistImageUrl: artist.artistImageUrl ?? '',
  }
}

export function normalizeSimilarArtists(artists: ISimilarArtist[]) {
  return artists.map(normalizeSimilarArtist)
}
