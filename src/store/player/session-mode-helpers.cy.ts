import { ISong } from '@/types/responses/song'
import { matchesSessionModeGenre, splitGenreCandidates } from './session-mode-helpers'

describe('session-mode-helpers', () => {
  it('splits and normalizes mixed genre strings', () => {
    const result = splitGenreCandidates('Film Scores, Classical / Video Game Music')
    expect(result).to.include('film scores')
    expect(result).to.include('classical')
    expect(result).to.include('video game music')
  })

  it('matches focus mode strictly by allowed genres', () => {
    const song = {
      id: '1',
      parent: '',
      isDir: false,
      title: 'Test',
      album: 'Album',
      artist: 'Artist',
      track: 1,
      year: 2024,
      genre: 'Metalcore',
      coverArt: '',
      size: 1,
      contentType: 'audio/mpeg',
      suffix: 'mp3',
      duration: 200,
      bitRate: 320,
      path: '',
      discNumber: 1,
      created: new Date().toISOString(),
      albumId: '',
      type: 'music',
      isVideo: false,
      bpm: 0,
      comment: '',
      sortName: 'Test',
      mediaType: 'audio',
      musicBrainzId: '',
      genres: [],
      replayGain: {
        trackGain: 0,
        trackPeak: 1,
        albumGain: 0,
        albumPeak: 1,
      },
    } as ISong

    const focusAllowed = ['classical', 'film scores', 'video game music']
    const matches = matchesSessionModeGenre(song, 'focus', focusAllowed, [])
    expect(matches).to.equal(false)
  })
})
