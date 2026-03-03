import type { Song } from '@/types/responses/song'
import { runWithRetry } from '@/utils/background-task-runner'
import { readStoredPlaylist, writeStoredPlaylist } from './playlist-storage'
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
    return readStoredPlaylist<TimeOfDayPlaylistMetadata>(
      STORAGE_KEY,
      STORAGE_KEY_METADATA,
    )
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
    console.error(
      '[DayPartPlaylist] Failed to verify generation status:',
      error,
    )
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
  writeStoredPlaylist(
    STORAGE_KEY,
    STORAGE_KEY_METADATA,
    generated.playlist,
    generated.metadata,
  )
  return generated
}

export async function generateAndSaveTimeOfDayPlaylistWithRetry(
  force: boolean = false,
) {
  return runWithRetry(() => generateAndSaveTimeOfDayPlaylist(force), {
    taskName: force ? 'daypart-generate-force' : 'daypart-generate',
    policy: {
      retries: 2,
      baseDelayMs: 500,
      maxDelayMs: 4000,
    },
  })
}

export async function checkAndCatchUpTimeOfDayPlaylist() {
  if (!shouldGenerateTimeOfDayPlaylist()) return false

  try {
    await runWithRetry(() => generateAndSaveTimeOfDayPlaylist(false), {
      taskName: 'daypart-catchup',
      policy: {
        retries: 2,
        baseDelayMs: 500,
        maxDelayMs: 4000,
      },
    })
    return true
  } catch (error) {
    console.error('[DayPartPlaylist] Catch-up generation failed:', error)
    return false
  }
}

export function startTimeOfDayScheduler(
  onGenerate?: (success: boolean) => void,
) {
  let timeoutId: NodeJS.Timeout | null = null

  const scheduleNext = () => {
    const msUntilNextSlot = getMillisecondsUntilNextDayPartBoundary()

    timeoutId = setTimeout(async () => {
      try {
        await runWithRetry(() => generateAndSaveTimeOfDayPlaylist(true), {
          taskName: 'daypart-scheduled-generate',
          policy: {
            retries: 2,
            baseDelayMs: 800,
            maxDelayMs: 6000,
          },
          onRetry: ({ attempt, delayMs }) => {
            console.warn(
              `[DayPartPlaylist] Scheduled retry ${attempt} in ${delayMs}ms`,
            )
          },
        })
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
