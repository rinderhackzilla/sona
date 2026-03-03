/**
 * Last.fm Feature Services
 * Provides personalized music discovery features using Last.fm API
 */
import type { Song } from '@/types/responses/song'
import { logger } from '@/utils/logger'

interface LastfmConfig {
  username: string
  apiKey: string
}

interface LastfmTrack {
  name: string
  artist: {
    '#text'?: string
    name?: string
    mbid?: string
  }
  playcount: string
  mbid?: string
  image: Array<{ '#text': string; size: string }>
}

interface OnRepeatResult {
  track: LastfmTrack | null
  playcount: number
  artistName?: string
  trackName?: string
  error?: string
}

interface Top50YearResult {
  tracks: LastfmTrack[]
  totalTracks: number
  error?: string
}

/**
 * Get the most played track from the last 7 days
 * @returns The "On Repeat" track with play count
 */
export async function getOnRepeat(
  config: LastfmConfig,
): Promise<OnRepeatResult> {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${config.username}&api_key=${config.apiKey}&period=7day&limit=1&format=json`,
    )

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`)
    }

    const data = await response.json()
    logger.info('[Last.fm Features] Raw API response:', data)

    if (data.error) {
      throw new Error(data.message || 'Last.fm API error')
    }

    const tracks = data.toptracks?.track

    if (!tracks || tracks.length === 0) {
      return {
        track: null,
        playcount: 0,
        error: 'No tracks found in the last 7 days',
      }
    }

    const topTrack = Array.isArray(tracks) ? tracks[0] : tracks
    logger.info('[Last.fm Features] Top track:', topTrack)

    // Extract artist name - can be in different formats
    const artistName =
      topTrack.artist?.['#text'] ||
      topTrack.artist?.name ||
      (typeof topTrack.artist === 'string' ? topTrack.artist : null)

    const trackName = topTrack.name

    logger.info('[Last.fm Features] Extracted:', { artistName, trackName })

    return {
      track: topTrack,
      playcount: parseInt(topTrack.playcount || '0', 10),
      artistName: artistName || 'Unknown',
      trackName: trackName || 'Unknown',
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
 * Get top 50 tracks from the last 12 months
 * @returns Top 50 tracks with play counts
 */
export async function getTop50Year(
  config: LastfmConfig,
): Promise<Top50YearResult> {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${config.username}&api_key=${config.apiKey}&period=12month&limit=50&format=json`,
    )

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`)
    }

    const data = await response.json()
    logger.info('[Last.fm Features] Top 50 Year raw response:', data)

    if (data.error) {
      throw new Error(data.message || 'Last.fm API error')
    }

    const tracks = data.toptracks?.track || []
    const trackArray = Array.isArray(tracks) ? tracks : [tracks]

    logger.info('[Last.fm Features] Found', trackArray.length, 'tracks')

    return {
      tracks: trackArray,
      totalTracks: trackArray.length,
    }
  } catch (error) {
    console.error('[Last.fm Features] Top 50 Year error:', error)
    return {
      tracks: [],
      totalTracks: 0,
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
  trackName: string,
): Promise<Song | null> {
  try {
    // Import subsonic service dynamically to avoid circular deps
    const { subsonic } = await import('@/service/subsonic')

    logger.info('[Last.fm Features] Searching for:', { artistName, trackName })

    // Search for track
    const searchQuery = `${artistName} ${trackName}`
    const results = await subsonic.search.get({
      query: searchQuery,
      songCount: 10,
      artistCount: 0,
      albumCount: 0,
    })

    logger.info('[Last.fm Features] Search results:', results)

    if (!results?.song || results.song.length === 0) {
      console.warn(
        `[Last.fm Features] Track not found in Navidrome: ${searchQuery}`,
      )
      return null
    }

    // Find best match - try exact first, then fuzzy
    const normalizeString = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')

    const artistNorm = normalizeString(artistName)
    const trackNorm = normalizeString(trackName)

    // Try exact match first
    let match = results.song.find(
      (song) =>
        normalizeString(song.artist) === artistNorm &&
        normalizeString(song.title) === trackNorm,
    )

    // If no exact match, try partial match on both
    if (!match) {
      match = results.song.find(
        (song) =>
          normalizeString(song.artist).includes(artistNorm) &&
          normalizeString(song.title).includes(trackNorm),
      )
    }

    // If still no match, just match on title
    if (!match) {
      match = results.song.find((song) =>
        normalizeString(song.title).includes(trackNorm),
      )
    }

    const result = (match || results.song[0]) as Song
    logger.info('[Last.fm Features] Found song:', result)

    return result
  } catch (error) {
    console.error('[Last.fm Features] Error finding track in Navidrome:', error)
    return null
  }
}

/**
 * Find multiple tracks in Navidrome
 * @param tracks Array of {artistName, trackName} objects
 * @returns Array of found songs (null for not found)
 */
export async function findTracksInNavidrome(
  tracks: Array<{ artistName: string; trackName: string; playcount?: number }>,
): Promise<Array<Song | null>> {
  const results = await Promise.all(
    tracks.map(async (track) => {
      const song = await findTrackInNavidrome(track.artistName, track.trackName)
      return song
    }),
  )

  return results
}
