import type { Song } from '@/types/responses/song'
import {
  generateTimeOfDayPlaylist,
  getCurrentDayPart,
  getMillisecondsUntilNextDayPartBoundary,
  type TimeOfDayPlaylistMetadata,
} from './time-of-day-playlist'

const STORAGE_KEY = 'time_of_day_playlist'
const STORAGE_KEY_METADATA = 'time_of_day_playlist_metadata'

export function loadTimeOfDayPlaylist(): {
  playlist: Song[]
  metadata: TimeOfDayPlaylistMetadata | null
} {
  try {
    const storedPlaylist = localStorage.getItem(STORAGE_KEY)
    const storedMetadata = localStorage.getItem(STORAGE_KEY_METADATA)

    if (!storedPlaylist || !storedMetadata) {
      return { playlist: [], metadata: null }
    }

    return {
      playlist: JSON.parse(storedPlaylist),
      metadata: JSON.parse(storedMetadata) as TimeOfDayPlaylistMetadata,
    }
  } catch (error) {
    console.error('[DayPartPlaylist] Failed to load playlist:', error)
    return { playlist: [], metadata: null }
  }
}

export function shouldGenerateTimeOfDayPlaylist() {
  try {
    const { metadata } = loadTimeOfDayPlaylist()
    if (!metadata) return true

    const { windowKey } = getCurrentDayPart()
    return metadata.windowKey !== windowKey
  } catch (error) {
    console.error('[DayPartPlaylist] Failed to verify generation status:', error)
    return true
  }
}

export async function generateAndSaveTimeOfDayPlaylist(force: boolean = false) {
  if (!force && !shouldGenerateTimeOfDayPlaylist()) {
    const existing = loadTimeOfDayPlaylist()
    if (existing.metadata) {
      return existing
    }
  }

  const generated = await generateTimeOfDayPlaylist(50)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(generated.playlist))
  localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(generated.metadata))
  return generated
}

export async function checkAndCatchUpTimeOfDayPlaylist() {
  if (!shouldGenerateTimeOfDayPlaylist()) return false

  try {
    await generateAndSaveTimeOfDayPlaylist(false)
    return true
  } catch (error) {
    console.error('[DayPartPlaylist] Catch-up generation failed:', error)
    return false
  }
}

export function startTimeOfDayScheduler(onGenerate?: (success: boolean) => void) {
  let timeoutId: NodeJS.Timeout | null = null

  const scheduleNext = () => {
    const msUntilNextSlot = getMillisecondsUntilNextDayPartBoundary()

    timeoutId = setTimeout(async () => {
      try {
        await generateAndSaveTimeOfDayPlaylist(true)
        onGenerate?.(true)
      } catch (error) {
        console.error('[DayPartPlaylist] Scheduled generation failed:', error)
        onGenerate?.(false)
      } finally {
        scheduleNext()
      }
    }, msUntilNextSlot)
  }

  scheduleNext()

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

