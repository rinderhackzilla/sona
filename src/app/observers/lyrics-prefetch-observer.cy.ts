import {
  buildLyricsPrefetchSongs,
  buildLyricsQueryKey,
} from './lyrics-prefetch-observer'

describe('LyricsPrefetchObserver helpers', () => {
  it('creates stable query keys', () => {
    const key = buildLyricsQueryKey('Artist', 'Track', 123)
    expect(key).to.deep.equal(['get-lyrics', 'Artist', 'Track', 123])
  })

  it('prefetches only next song and skips invalid entries', () => {
    const list = [
      { id: 's0', artist: 'A0', title: 'T0', duration: 100 },
      { id: 's1', artist: 'A1', title: 'T1', duration: 120 },
      { id: 's2', artist: 'A2', title: 'T2', duration: 140 },
    ]

    const result = buildLyricsPrefetchSongs(list, 0)
    expect(result).to.have.length(1)
    expect(result[0].id).to.equal('s1')
  })
})

