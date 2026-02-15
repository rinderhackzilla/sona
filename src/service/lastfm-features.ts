/**
 * Last.fm Feature Services
 * Provides personalized music discovery features using Last.fm API
 */

interface LastfmConfig {
  username: string
  apiKey: string
}

interface LastfmTrack {
  name: string
  artist: {
    '#text': string
    mbid?: string
  }
  playcount: string
  mbid?: string
  image: Array<{ '#text': string; size: string }>
}

interface OnRepeatResult {
  track: LastfmTrack | null
  playcount: number
  error?: string
}

/**
 * Get the most played track from the last 7 days
 * @returns The "On Repeat" track with play count
 */
export async function getOnRepeat(
  config: LastfmConfig
): Promise<OnRepeatResult> {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${config.username}&api_key=${config.apiKey}&period=7day&limit=1&format=json`
    )

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.message || 'Last.fm API error')
    }

    const tracks = data.toptracks?.track

    if (!tracks || tracks.length === 0) {
      return {
        track: null,
        playcount: 0,
        error: 'No tracks found in the last 7 days'
      }
    }

    const topTrack = Array.isArray(tracks) ? tracks[0] : tracks

    return {
      track: topTrack,
      playcount: parseInt(topTrack.playcount || '0', 10),
    }
  } catch (error) {
    console.error('[Last.fm Features] On Repeat error:', error)
    return {
      track: null,
      playcount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Search for a track in Navidrome by artist and title
 * Returns the first matching song
 */
export async function findTrackInNavidrome(
  artistName: string,
  trackName: string
): Promise<any | null> {
  try {
    // Import subsonic service dynamically to avoid circular deps
    const { subsonic } = await import('@/service/subsonic')
    
    // Search for track
    const searchQuery = `${artistName} ${trackName}`
    const results = await subsonic.search.search3(searchQuery, {
      songCount: 5,
      artistCount: 0,
      albumCount: 0,
    })

    if (!results?.song || results.song.length === 0) {
      console.warn(`[Last.fm Features] Track not found in Navidrome: ${searchQuery}`)
      return null
    }

    // Find best match
    const exactMatch = results.song.find(
      (song) =>
        song.artist.toLowerCase() === artistName.toLowerCase() &&
        song.title.toLowerCase() === trackName.toLowerCase()
    )

    return exactMatch || results.song[0]
  } catch (error) {
    console.error('[Last.fm Features] Error finding track in Navidrome:', error)
    return null
  }
}
