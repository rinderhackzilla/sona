import { Albums } from '@/types/responses/album'
import { dedupeAlbumsForDisplay } from './albumDedup'

function makeAlbum(overrides: Partial<Albums>): Albums {
  return {
    id: 'a1',
    name: 'Test Album',
    artist: 'Test Artist',
    artistId: 'artist-1',
    coverArt: 'cover-1',
    songCount: 10,
    duration: 1000,
    created: '2024-01-01T00:00:00.000Z',
    genre: 'rock',
    userRating: 0,
    genres: [],
    musicBrainzId: '',
    isCompilation: false,
    sortName: 'Test Album',
    discTitles: [],
    ...overrides,
  }
}

describe('albumDedup', () => {
  it('keeps only one representative album for mirrored duplicates', () => {
    const albums: Albums[] = [
      makeAlbum({ id: 'dup-1', songCount: 10, duration: 1000 }),
      makeAlbum({ id: 'dup-2', songCount: 12, duration: 1200 }),
    ]

    const deduped = dedupeAlbumsForDisplay(albums)
    expect(deduped).to.have.length(1)
    expect(deduped[0].songCount).to.equal(12)
  })
})
