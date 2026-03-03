import { buildArtworkPrefetchCovers } from './artwork-prefetch-observer'

describe('ArtworkPrefetchObserver helpers', () => {
  it('builds deduplicated cover targets from next songs only', () => {
    const list = [
      { id: 's0', coverArt: 'c0' },
      { id: 's1', coverArt: 'c1' },
      { id: 's2', coverArt: 'c2' },
      { id: 's3', coverArt: 'c2' },
      { id: 's4', coverArt: 'c4' },
    ]

    const result = buildArtworkPrefetchCovers(list, 0)
    expect(result).to.deep.equal([
      { id: 'c1', type: 'song', size: '300' },
      { id: 'c2', type: 'song', size: '300' },
    ])
  })

  it('returns empty when no future covers exist', () => {
    const list = [{ id: 's0', coverArt: 'c0' }]
    const result = buildArtworkPrefetchCovers(list, 0)
    expect(result).to.deep.equal([])
  })
})

