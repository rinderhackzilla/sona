import { subsonic } from '@/service/subsonic'
import type { Song } from '@/types/responses/song'
import type { ISimilarArtist } from '@/types/responses/artist'

interface LastFmTrack {
  name: string
  playcount: string
  listeners: string
  mbid?: string
  url: string
  artist: {
    name: string
    mbid?: string
    url: string
  }
}

interface TopTracksResponse {
  toptracks: {
    track: LastFmTrack[]
    '@attr': {
      artist: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
  }
}

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/'
const TARGET_SONGS = 30
const TOP_TRACKS_COUNT = 15 // Get top 15 from Last.fm, fill rest with random

interface GenerateConfig {
  username: string
  apiKey: string
}

/**
 * Get top tracks for an artist from Last.fm
 */
async function getArtistTopTracks(
  artistName: string,
  apiKey: string,
  limit: number = 15
): Promise<LastFmTrack[]> {
  const url = new URL(LASTFM_API_URL)
  url.searchParams.append('method', 'artist.getTopTracks')
  url.searchParams.append('artist', artistName)
  url.searchParams.append('api_key', apiKey)
  url.searchParams.append('format', 'json')
  url.searchParams.append('limit', String(limit))

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.statusText}`)
  }

  const data: TopTracksResponse = await response.json()
  return data.toptracks?.track || []
}

/**
 * Select a random artist from library
 */
async function selectRandomArtist(): Promise<ISimilarArtist> {
  console.log('[ThisIsArtist] Fetching all artists from library...')
  
  const allArtists = await subsonic.artists.getAll()

  if (!allArtists || allArtists.length === 0) {
    throw new Error('No artists found in library')
  }

  // Select random artist
  const randomIndex = Math.floor(Math.random() * allArtists.length)
  const selectedArtist = allArtists[randomIndex]

  console.log(`[ThisIsArtist] Selected random artist: ${selectedArtist.name} (${allArtists.length} total artists)`)
  
  return selectedArtist
}

/**
 * Get all songs for an artist from Navidrome
 */
async function getArtistSongs(artistId: string): Promise<Song[]> {
  const artist = await subsonic.artists.getOne(artistId)
  
  if (!artist) {
    throw new Error(`Artist not found: ${artistId}`)
  }

  const songs: Song[] = []

  // Collect all songs from all albums
  if (artist.album) {
    for (const album of artist.album) {
      if (album.song) {
        songs.push(...album.song)
      }
    }
  }

  return songs
}

/**
 * Match Last.fm top tracks to Navidrome songs
 */
function matchTopTracks(
  topTracks: LastFmTrack[],
  artistSongs: Song[]
): Song[] {
  const matched: Song[] = []
  const usedSongIds = new Set<string>()

  for (const track of topTracks) {
    const trackNameLower = track.name.toLowerCase().trim()
    
    // Find matching song in library
    const matchedSong = artistSongs.find(song => {
      if (usedSongIds.has(song.id)) return false
      const songTitleLower = song.title.toLowerCase().trim()
      return songTitleLower === trackNameLower || songTitleLower.includes(trackNameLower)
    })

    if (matchedSong) {
      matched.push(matchedSong)
      usedSongIds.add(matchedSong.id)
    }
  }

  return matched
}

/**
 * Generate "This is [Artist]" playlist
 */
export async function generateThisIsArtist(
  config: GenerateConfig
): Promise<{
  playlist: Song[]
  artist: ISimilarArtist
}> {
  console.log('[ThisIsArtist] 🎵 Starting playlist generation...')

  // Step 1: Select random artist
  const artist = await selectRandomArtist()

  // Step 2: Get all songs from artist
  console.log(`[ThisIsArtist] Fetching songs for ${artist.name}...`)
  const artistSongs = await getArtistSongs(artist.id)

  if (artistSongs.length === 0) {
    throw new Error(`No songs found for artist: ${artist.name}`)
  }

  console.log(`[ThisIsArtist] Found ${artistSongs.length} songs`)

  let playlist: Song[] = []
  let topTracksMatched: Song[] = []

  // Step 3: Try to get top tracks from Last.fm
  try {
    console.log(`[ThisIsArtist] Fetching top ${TOP_TRACKS_COUNT} tracks from Last.fm...`)
    const topTracks = await getArtistTopTracks(artist.name, config.apiKey, TOP_TRACKS_COUNT)
    
    if (topTracks.length > 0) {
      console.log(`[ThisIsArtist] Got ${topTracks.length} top tracks from Last.fm`)
      topTracksMatched = matchTopTracks(topTracks, artistSongs)
      console.log(`[ThisIsArtist] Matched ${topTracksMatched.length} top tracks to library`)
      playlist.push(...topTracksMatched)
    }
  } catch (error) {
    console.warn(`[ThisIsArtist] Failed to get Last.fm top tracks, using playCount fallback:`, error)
  }

  // Step 4: Fallback if Last.fm failed or didn't provide enough songs
  if (playlist.length < TOP_TRACKS_COUNT) {
    console.log(`[ThisIsArtist] Using playCount fallback (have ${playlist.length}/${TOP_TRACKS_COUNT})...`)
    
    // Sort by playCount
    const sortedByPlayCount = [...artistSongs]
      .filter(song => !playlist.some(p => p.id === song.id)) // Exclude already added
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    
    const needed = TOP_TRACKS_COUNT - playlist.length
    playlist.push(...sortedByPlayCount.slice(0, needed))
    
    console.log(`[ThisIsArtist] Added ${needed} songs from playCount (total now: ${playlist.length})`)
  }

  // Step 5: Fill remaining slots with random songs
  const remainingSlots = TARGET_SONGS - playlist.length
  if (remainingSlots > 0) {
    const usedIds = new Set(playlist.map(s => s.id))
    const remainingSongs = artistSongs.filter(song => !usedIds.has(song.id))
    
    // Shuffle remaining songs
    const shuffled = remainingSongs.sort(() => Math.random() - 0.5)
    playlist.push(...shuffled.slice(0, remainingSlots))
    
    console.log(`[ThisIsArtist] Added ${remainingSlots} random songs (total: ${playlist.length})`)
  }

  // Trim to exactly 30 if we have more
  playlist = playlist.slice(0, TARGET_SONGS)

  console.log(`[ThisIsArtist] ✓ Playlist complete: "This is ${artist.name}" with ${playlist.length} songs`)

  return {
    playlist,
    artist,
  }
}
