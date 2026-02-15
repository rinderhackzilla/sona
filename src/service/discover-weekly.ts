import { lastfm } from './lastfm'
import { search } from './search'
import { songs } from './songs'
import type { LastFmArtist, LastFmSimilarArtist } from './lastfm'
import type { Song } from '@/types/responses/song'

interface DiscoverWeeklyConfig {
  username: string
  apiKey: string
  targetArtists?: number
  songsPerArtist?: number
  genreBoost?: number
}

interface ArtistWithMatch extends LastFmSimilarArtist {
  score: number
}

interface GenerationResult {
  playlist: Song[]
  metadata: {
    generatedAt: string
    artistsUsed: string[]
    totalSongs: number
  }
}

/**
 * Fuzzy match artist names (handles slight differences)
 */
function fuzzyMatch(name1: string, name2: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim()

  return normalize(name1) === normalize(name2)
}

/**
 * Check if artist exists in Subsonic library
 */
async function findArtistInLibrary(
  artistName: string,
): Promise<string | null> {
  try {
    const results = await search.get({
      query: artistName,
      artistCount: 5,
      albumCount: 0,
      songCount: 0,
    })

    const matchedArtist = results?.artist?.find((a) =>
      fuzzyMatch(a.name, artistName),
    )

    return matchedArtist?.id || null
  } catch (error) {
    console.error(`[DiscoverWeekly] Failed to search for ${artistName}:`, error)
    return null
  }
}

/**
 * Get random songs from an artist
 */
async function getArtistSongs(
  artistId: string,
  count: number,
): Promise<Song[]> {
  try {
    // Get all albums by artist
    const albums = await search.get({
      query: '',
      artistCount: 0,
      albumCount: 100,
      songCount: 0,
      albumOffset: 0,
    })

    // Filter to only this artist's albums
    const artistAlbums = albums?.album?.filter((a) => a.artistId === artistId)

    if (!artistAlbums || artistAlbums.length === 0) {
      return []
    }

    // Get random songs from random albums
    const allSongs: Song[] = []
    const randomAlbums = artistAlbums
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    for (const album of randomAlbums) {
      try {
        const randomSongsFromAlbum = await songs.getRandomSongs({
          size: count,
        })
        if (randomSongsFromAlbum) {
          allSongs.push(
            ...randomSongsFromAlbum.filter((s) => s.artistId === artistId),
          )
        }
      } catch (error) {
        console.error(`[DiscoverWeekly] Failed to get songs:`, error)
      }
    }

    // Shuffle and limit
    return allSongs.sort(() => Math.random() - 0.5).slice(0, count)
  } catch (error) {
    console.error(`[DiscoverWeekly] Failed to get artist songs:`, error)
    return []
  }
}

/**
 * Main Discover Weekly generation function
 */
export async function generateDiscoverWeekly(
  config: DiscoverWeeklyConfig,
): Promise<GenerationResult> {
  const {
    username,
    apiKey,
    targetArtists = 15,
    songsPerArtist = 4,
  } = config

  console.log('[DiscoverWeekly] Starting generation...')

  // Step 1: Get top artists from Last.fm
  const [overallTopArtists, recentTopArtists] = await Promise.all([
    lastfm.getTopArtists(username, apiKey, 'overall', 30),
    lastfm.getTopArtists(username, apiKey, '1month', 30),
  ])

  console.log(
    `[DiscoverWeekly] Got ${overallTopArtists.length} overall + ${recentTopArtists.length} recent artists`,
  )

  // Merge and deduplicate
  const topArtistsMap = new Map<string, LastFmArtist>()
  ;[...overallTopArtists, ...recentTopArtists].forEach((artist) => {
    topArtistsMap.set(artist.name.toLowerCase(), artist)
  })
  const topArtists = Array.from(topArtistsMap.values())

  // Step 2: Get similar artists for each top artist
  const similarArtistsMap = new Map<string, ArtistWithMatch>()

  for (const topArtist of topArtists.slice(0, 10)) {
    try {
      const similar = await lastfm.getSimilarArtists(topArtist.name, apiKey, 20)

      similar.forEach((simArtist) => {
        const key = simArtist.name.toLowerCase()
        // Skip if already in top artists
        if (topArtistsMap.has(key)) return

        const existingScore = similarArtistsMap.get(key)?.score || 0
        const newScore = existingScore + parseFloat(simArtist.match)

        similarArtistsMap.set(key, {
          ...simArtist,
          score: newScore,
        })
      })
    } catch (error) {
      console.error(
        `[DiscoverWeekly] Failed to get similar for ${topArtist.name}:`,
        error,
      )
    }
  }

  console.log(
    `[DiscoverWeekly] Found ${similarArtistsMap.size} similar artists`,
  )

  // Step 3: Sort by score and find in library
  const sortedSimilar = Array.from(similarArtistsMap.values()).sort(
    (a, b) => b.score - a.score,
  )

  const foundArtists: Array<{ name: string; id: string }> = []

  for (const simArtist of sortedSimilar) {
    if (foundArtists.length >= targetArtists) break

    const artistId = await findArtistInLibrary(simArtist.name)
    if (artistId) {
      foundArtists.push({
        name: simArtist.name,
        id: artistId,
      })
      console.log(
        `[DiscoverWeekly] ✓ Found ${simArtist.name} (score: ${simArtist.score.toFixed(2)})`,
      )
    }
  }

  console.log(
    `[DiscoverWeekly] Found ${foundArtists.length}/${targetArtists} artists in library`,
  )

  // Step 4: Get songs from found artists
  const allSongs: Song[] = []

  for (const artist of foundArtists) {
    const artistSongs = await getArtistSongs(artist.id, songsPerArtist)
    allSongs.push(...artistSongs)
  }

  // Step 5: Shuffle final playlist
  const shuffledPlaylist = allSongs.sort(() => Math.random() - 0.5)

  console.log(
    `[DiscoverWeekly] ✓ Generated playlist with ${shuffledPlaylist.length} songs`,
  )

  return {
    playlist: shuffledPlaylist,
    metadata: {
      generatedAt: new Date().toISOString(),
      artistsUsed: foundArtists.map((a) => a.name),
      totalSongs: shuffledPlaylist.length,
    },
  }
}

export async function shouldRegeneratePlaylist(
  lastGenerated: string | null,
): Promise<boolean> {
  if (!lastGenerated) return true

  const lastDate = new Date(lastGenerated)
  const now = new Date()

  // Check if it's Monday and more than 7 days have passed
  const daysSince = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  return daysSince >= 7 && now.getDay() === 1 // Monday
}
