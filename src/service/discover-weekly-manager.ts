import { generateDiscoverWeekly } from './discover-weekly'
import {
  readStoredJson,
  readStoredPlaylist,
  readStoredString,
  writeStoredPlaylist,
  writeStoredString,
} from './playlist-storage'
import type { Song } from '@/types/responses/song'

const STORAGE_KEY = 'discover_weekly_playlist'
const STORAGE_KEY_METADATA = 'discover_weekly_metadata'
const STORAGE_KEY_WEEK_FLAG = 'discover_weekly_current_week'

interface PlaylistMetadata {
  generatedAt: string
  artistsUsed: string[]
  totalSongs: number
  weekKey: string // Format: "2026-W07"
}

interface DiscoverWeeklyConfig {
  username: string
  apiKey: string
  targetArtists?: number
  songsPerArtist?: number
}

/**
 * Get ISO week number and year (format: "2026-W07")
 */
function getISOWeek(date: Date): string {
  const target = new Date(date.valueOf())
  const dayNumber = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNumber + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Check if it's Monday
 */
function isMonday(date: Date = new Date()): boolean {
  return date.getDay() === 1
}

/**
 * Check if playlist needs generation for current week
 */
export function shouldGeneratePlaylist(): boolean {
  try {
    const currentWeek = getISOWeek(new Date())
    const storedWeek = readStoredString(STORAGE_KEY_WEEK_FLAG)
    const storedMetadata = readStoredJson<PlaylistMetadata>(STORAGE_KEY_METADATA)

    // No playlist exists yet
    if (!storedMetadata) {
      console.log('[DiscoverWeekly] No playlist found, needs generation')
      return true
    }

    // Week flag missing, check metadata
    if (!storedWeek) {
      const playlistWeek =
        storedMetadata.weekKey || getISOWeek(new Date(storedMetadata.generatedAt))
      
      // Update flag and check
      if (playlistWeek !== currentWeek) {
        console.log(`[DiscoverWeekly] Playlist from old week (${playlistWeek}), needs regeneration`)
        return true
      }
      
      // Save flag for future checks
      writeStoredString(STORAGE_KEY_WEEK_FLAG, playlistWeek)
      return false
    }

    // Check if current week differs from stored week
    if (currentWeek !== storedWeek) {
      console.log(`[DiscoverWeekly] New week detected (${currentWeek} vs ${storedWeek}), needs regeneration`)
      return true
    }

    console.log(`[DiscoverWeekly] Playlist for week ${currentWeek} already exists`)
    return false
  } catch (error) {
    console.error('[DiscoverWeekly] Error checking generation status:', error)
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
    const { playlist, metadata } = readStoredPlaylist<PlaylistMetadata>(
      STORAGE_KEY,
      STORAGE_KEY_METADATA,
    )
    if (metadata) {
      console.log(`[DiscoverWeekly] Loaded playlist from week ${metadata.weekKey || 'unknown'}`)
      
      return { playlist, metadata }
    }

    return { playlist: [], metadata: null }
  } catch (error) {
    console.error('[DiscoverWeekly] Failed to load playlist:', error)
    return { playlist: [], metadata: null }
  }
}

/**
 * Generate and save playlist
 */
export async function generateAndSavePlaylist(
  config: DiscoverWeeklyConfig,
  force: boolean = false
): Promise<{
  playlist: Song[]
  metadata: PlaylistMetadata
}> {
  const currentWeek = getISOWeek(new Date())

  // Check if generation is needed (unless forced)
  if (!force && !shouldGeneratePlaylist()) {
    console.log('[DiscoverWeekly] Generation not needed, loading existing playlist')
    const { playlist, metadata } = loadPlaylist()
    if (metadata) {
      return { playlist, metadata }
    }
  }

  console.log(`[DiscoverWeekly] Generating playlist for week ${currentWeek}...`)

  // Generate playlist
  const result = await generateDiscoverWeekly({
    username: config.username,
    apiKey: config.apiKey,
    targetArtists: config.targetArtists || 15,
    songsPerArtist: config.songsPerArtist || 4,
  })

  // Add week key to metadata
  const metadata: PlaylistMetadata = {
    ...result.metadata,
    weekKey: currentWeek,
  }

  // Save to localStorage
  writeStoredPlaylist(STORAGE_KEY, STORAGE_KEY_METADATA, result.playlist, metadata)
  writeStoredString(STORAGE_KEY_WEEK_FLAG, currentWeek)

  console.log(`[DiscoverWeekly] ✓ Playlist generated and saved for week ${currentWeek}`)

  return {
    playlist: result.playlist,
    metadata,
  }
}

/**
 * Check if catch-up generation is needed (called on app startup)
 */
export async function checkAndCatchUp(
  config: DiscoverWeeklyConfig
): Promise<boolean> {
  if (!config.username || !config.apiKey) {
    console.log('[DiscoverWeekly] Last.fm not configured, skipping catch-up')
    return false
  }

  const needsGeneration = shouldGeneratePlaylist()

  if (needsGeneration) {
    console.log('[DiscoverWeekly] 🔄 Catch-up generation needed, generating now...')
    try {
      await generateAndSavePlaylist(config, false)
      return true
    } catch (error) {
      console.error('[DiscoverWeekly] Catch-up generation failed:', error)
      return false
    }
  }

  return false
}

/**
 * Schedule next Monday generation check
 * Returns milliseconds until next Monday 00:00
 */
export function getMillisecondsUntilNextMonday(): number {
  const now = new Date()
  const nextMonday = new Date(now)
  
  // Calculate days until next Monday
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  
  // Set to midnight
  nextMonday.setHours(0, 0, 0, 0)
  
  return nextMonday.getTime() - now.getTime()
}

/**
 * Start scheduler (for use in Electron main process or renderer with timer)
 */
export function startWeeklyScheduler(
  config: DiscoverWeeklyConfig,
  onGenerate?: (success: boolean) => void
): () => void {
  let timeoutId: NodeJS.Timeout | null = null

  const scheduleNext = () => {
    const msUntilMonday = getMillisecondsUntilNextMonday()
    const hoursUntilMonday = (msUntilMonday / (1000 * 60 * 60)).toFixed(1)
    
    console.log(`[DiscoverWeekly] ⏰ Next generation scheduled in ${hoursUntilMonday} hours`)

    timeoutId = setTimeout(async () => {
      if (isMonday() && shouldGeneratePlaylist()) {
        console.log('[DiscoverWeekly] 🎵 Monday arrived! Generating playlist...')
        try {
          await generateAndSavePlaylist(config)
          onGenerate?.(true)
        } catch (error) {
          console.error('[DiscoverWeekly] Scheduled generation failed:', error)
          onGenerate?.(false)
        }
      }
      
      // Schedule next check
      scheduleNext()
    }, msUntilMonday)
  }

  // Start scheduling
  scheduleNext()

  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      console.log('[DiscoverWeekly] Scheduler stopped')
    }
  }
}
