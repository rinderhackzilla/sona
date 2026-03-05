/**
 * Discover Daily Background Scheduler
 * Runs in Electron Main Process
 *
 * This scheduler runs independently of the renderer process.
 * It checks daily at 00:00 if a new playlist needs to be generated.
 *
 * Usage in main.ts:
 * import { startDiscoverWeeklyScheduler } from './discover-weekly-scheduler'
 * startDiscoverWeeklyScheduler()
 */

import { app } from 'electron'

let schedulerTimeout: NodeJS.Timeout | null = null
let isRunning = false

function schedulerLog(message: string) {
  if (!app.isPackaged) {
    console.info(message)
  }
}

/**
 * Get current local date key (format: "2026-03-04")
 */
function getDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Calculate milliseconds until next local midnight
 */
function getMillisecondsUntilNextMidnight(): number {
  const now = new Date()
  const nextMidnight = new Date(now)

  nextMidnight.setDate(now.getDate() + 1)
  nextMidnight.setHours(0, 0, 0, 0)

  return nextMidnight.getTime() - now.getTime()
}

/**
 * Notify renderer process to generate playlist
 * The renderer will handle the actual generation since it has access to localStorage
 */
function notifyRenderer(event: 'check' | 'daily-trigger') {
  const windows = require('electron').BrowserWindow.getAllWindows()

  if (windows.length > 0) {
    const mainWindow = windows[0]
    mainWindow.webContents.send('discover-weekly:schedule-event', {
      event,
      timestamp: new Date().toISOString(),
      dayKey: getDateKey(new Date()),
    })
    schedulerLog(`[Electron Scheduler] Sent ${event} event to renderer`)
  }
}

/**
 * Schedule the next midnight check
 */
function scheduleNextCheck() {
  if (!isRunning) return

  const msUntilMidnight = getMillisecondsUntilNextMidnight()
  const hoursUntilMidnight = (msUntilMidnight / (1000 * 60 * 60)).toFixed(1)

  schedulerLog(`[Electron Scheduler] Next check in ${hoursUntilMidnight} hours`)

  schedulerTimeout = setTimeout(() => {
    schedulerLog('[Electron Scheduler] Midnight trigger reached')
    notifyRenderer('daily-trigger')

    // Schedule next check
    scheduleNextCheck()
  }, msUntilMidnight)
}

/**
 * Start the background scheduler
 */
export function startDiscoverWeeklyScheduler() {
  if (isRunning) {
    schedulerLog('[Electron Scheduler] Already running')
    return
  }

  isRunning = true
  schedulerLog('[Electron Scheduler] Started Discover Daily scheduler')

  // Initial check on startup (after 5 seconds delay)
  setTimeout(() => {
    schedulerLog('[Electron Scheduler] Performing startup check...')
    notifyRenderer('check')
  }, 5000)

  // Schedule first daily midnight check
  scheduleNextCheck()

  // Clean up on app quit
  app.on('before-quit', stopDiscoverWeeklyScheduler)
}

/**
 * Stop the scheduler
 */
export function stopDiscoverWeeklyScheduler() {
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout)
    schedulerTimeout = null
  }
  isRunning = false
  schedulerLog('[Electron Scheduler] Stopped')
}
