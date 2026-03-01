/**
 * Discover Weekly Background Scheduler
 * Runs in Electron Main Process
 * 
 * This scheduler runs independently of the renderer process.
 * It checks every Monday at 00:00 if a new playlist needs to be generated.
 * 
 * Usage in main.ts:
 * import { startDiscoverWeeklyScheduler } from './discover-weekly-scheduler'
 * startDiscoverWeeklyScheduler()
 */

import { app } from 'electron'

let schedulerTimeout: NodeJS.Timeout | null = null
let isRunning = false

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
 * Calculate milliseconds until next Monday 00:00
 */
function getMillisecondsUntilNextMonday(): number {
  const now = new Date()
  const nextMonday = new Date(now)
  
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  nextMonday.setHours(0, 0, 0, 0)
  
  return nextMonday.getTime() - now.getTime()
}

/**
 * Check if it's Monday
 */
function isMonday(date: Date = new Date()): boolean {
  return date.getDay() === 1
}

/**
 * Notify renderer process to generate playlist
 * The renderer will handle the actual generation since it has access to localStorage
 */
function notifyRenderer(event: 'check' | 'monday-trigger') {
  const windows = require('electron').BrowserWindow.getAllWindows()
  
  if (windows.length > 0) {
    const mainWindow = windows[0]
    mainWindow.webContents.send('discover-weekly:schedule-event', {
      event,
      timestamp: new Date().toISOString(),
      weekKey: getISOWeek(new Date()),
    })
    console.log(`[Electron Scheduler] Sent ${event} event to renderer`)
  }
}

/**
 * Schedule the next Monday check
 */
function scheduleNextCheck() {
  if (!isRunning) return

  const msUntilMonday = getMillisecondsUntilNextMonday()
  const hoursUntilMonday = (msUntilMonday / (1000 * 60 * 60)).toFixed(1)
  
  console.log(`[Electron Scheduler] Next check in ${hoursUntilMonday} hours`)

  schedulerTimeout = setTimeout(() => {
    if (isMonday()) {
      console.log('[Electron Scheduler] 🎵 Monday detected! Notifying renderer...')
      notifyRenderer('monday-trigger')
    } else {
      console.log('[Electron Scheduler] Not Monday yet, rescheduling...')
    }
    
    // Schedule next check
    scheduleNextCheck()
  }, msUntilMonday)
}

/**
 * Start the background scheduler
 */
export function startDiscoverWeeklyScheduler() {
  if (isRunning) {
    console.log('[Electron Scheduler] Already running')
    return
  }

  isRunning = true
  console.log('[Electron Scheduler] Started Discover Weekly scheduler')
  
  // Initial check on startup (after 5 seconds delay)
  setTimeout(() => {
    console.log('[Electron Scheduler] Performing startup check...')
    notifyRenderer('check')
  }, 5000)

  // Schedule first Monday check
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
  console.log('[Electron Scheduler] Stopped')
}
