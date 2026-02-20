import { generateThisIsArtist } from './this-is-artist'
import type { Song } from '@/types/responses/song'
import type { ISimilarArtist } from '@/types/responses/artist'

const STORAGE_KEY = 'this_is_artist_playlist'
const STORAGE_KEY_METADATA = 'this_is_artist_metadata'
const STORAGE_KEY_DATE_FLAG = 'this_is_artist_current_date'

interface PlaylistMetadata {
  generatedAt: string
  artist: ISimilarArtist
  totalSongs: number
  dateKey: string // Format: "2026-02-15"
}

interface ThisIsArtistConfig {
  username: string
  apiKey: string
}

/**
 * Get date key (format: "2026-02-15")
 */
function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get midnight of today
 */
function _getMidnightToday(): Date {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  return midnight
}

/**
 * Check if playlist needs generation for today
 */
export function shouldGeneratePlaylist(): boolean {
  try {
    const today = getDateKey()
    const storedDate = localStorage.getItem(STORAGE_KEY_DATE_FLAG)
    const storedMetadata = localStorage.getItem(STORAGE_KEY_METADATA)

    // No playlist exists yet
    if (!storedMetadata) {
      console.log('[ThisIsArtist] No playlist found, needs generation')
      return true
    }

    // Date flag missing, check metadata
    if (!storedDate) {
      const metadata: PlaylistMetadata = JSON.parse(storedMetadata)
      const playlistDate = metadata.dateKey || getDateKey(new Date(metadata.generatedAt))
      
      // Update flag and check
      if (playlistDate !== today) {
        console.log(`[ThisIsArtist] Playlist from old date (${playlistDate}), needs regeneration`)
        return true
      }
      
      // Save flag for future checks
      localStorage.setItem(STORAGE_KEY_DATE_FLAG, playlistDate)
      return false
    }

    // Check if current date differs from stored date
    if (today !== storedDate) {
      console.log(`[ThisIsArtist] New day detected (${today} vs ${storedDate}), needs regeneration`)
      return true
    }

    console.log(`[ThisIsArtist] Playlist for ${today} already exists`)
    return false
  } catch (error) {
    console.error('[ThisIsArtist] Error checking generation status:', error)
    return false
  }
}

/**
 * Load playlist from storage
 */
export function loadPlaylist(): {
  playlist: Song[]
  metadata: PlaylistMetadata | null
} {
  try {
    const storedPlaylist = localStorage.getItem(STORAGE_KEY)
    const storedMetadata = localStorage.getItem(STORAGE_KEY_METADATA)

    if (storedPlaylist && storedMetadata) {
      const playlist = JSON.parse(storedPlaylist)
      const metadata: PlaylistMetadata = JSON.parse(storedMetadata)
      
      console.log(`[ThisIsArtist] Loaded playlist: This is ${metadata.artist.name} (${metadata.dateKey})`)
      
      return { playlist, metadata }
    }

    return { playlist: [], metadata: null }
  } catch (error) {
    console.error('[ThisIsArtist] Failed to load playlist:', error)
    return { playlist: [], metadata: null }
  }
}

/**
 * Generate and save playlist
 */
export async function generateAndSavePlaylist(
  config: ThisIsArtistConfig,
  force: boolean = false
): Promise<{
  playlist: Song[]
  metadata: PlaylistMetadata
}> {
  const today = getDateKey()

  // Check if generation is needed (unless forced)
  if (!force && !shouldGeneratePlaylist()) {
    console.log('[ThisIsArtist] Generation not needed, loading existing playlist')
    const { playlist, metadata } = loadPlaylist()
    if (metadata) {
      return { playlist, metadata }
    }
  }

  console.log(`[ThisIsArtist] Generating playlist for ${today}...`)

  // Generate playlist
  const result = await generateThisIsArtist({
    username: config.username,
    apiKey: config.apiKey,
  })

  // Create metadata
  const metadata: PlaylistMetadata = {
    generatedAt: new Date().toISOString(),
    artist: result.artist,
    totalSongs: result.playlist.length,
    dateKey: today,
  }

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result.playlist))
  localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(metadata))
  localStorage.setItem(STORAGE_KEY_DATE_FLAG, today)

  console.log(`[ThisIsArtist] ✓ Playlist generated: This is ${result.artist.name} (${today})`)

  return {
    playlist: result.playlist,
    metadata,
  }
}

/**
 * Check if catch-up generation is needed (called on app startup)
 */
export async function checkAndCatchUp(
  config: ThisIsArtistConfig
): Promise<boolean> {
  if (!config.username || !config.apiKey) {
    console.log('[ThisIsArtist] Last.fm not configured, skipping catch-up')
    return false
  }

  const needsGeneration = shouldGeneratePlaylist()

  if (needsGeneration) {
    console.log('[ThisIsArtist] 🔄 Catch-up generation needed, generating now...')
    try {
      await generateAndSavePlaylist(config, false)
      return true
    } catch (error) {
      console.error('[ThisIsArtist] Catch-up generation failed:', error)
      return false
    }
  }

  return false
}

/**
 * Get milliseconds until next midnight
 */
export function getMillisecondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

/**
 * Start scheduler (generates new playlist every midnight)
 */
export function startDailyScheduler(
  config: ThisIsArtistConfig,
  onGenerate?: (success: boolean) => void
): () => void {
  let timeoutId: NodeJS.Timeout | null = null

  const scheduleNext = () => {
    const msUntilMidnight = getMillisecondsUntilMidnight()
    const hoursUntilMidnight = (msUntilMidnight / (1000 * 60 * 60)).toFixed(1)
    
    console.log(`[ThisIsArtist] ⏰ Next generation scheduled in ${hoursUntilMidnight} hours`)

    timeoutId = setTimeout(async () => {
      if (shouldGeneratePlaylist()) {
        console.log('[ThisIsArtist] 🎵 Midnight! Generating new playlist...')
        try {
          await generateAndSavePlaylist(config)
          onGenerate?.(true)
        } catch (error) {
          console.error('[ThisIsArtist] Scheduled generation failed:', error)
          onGenerate?.(false)
        }
      }
      
      // Schedule next check
      scheduleNext()
    }, msUntilMidnight)
  }

  // Start scheduling
  scheduleNext()

  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      console.log('[ThisIsArtist] Scheduler stopped')
    }
  }
}
