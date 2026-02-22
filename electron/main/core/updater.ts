import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'
import { IpcChannels } from '../../preload/types'

const { autoUpdater } = electronUpdater

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, '').split('+')[0]
}

function parseNumericCore(version: string): number[] {
  const [core] = normalizeVersion(version).split('-')
  return core
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0))
}

function comparePrereleaseIdentifiers(a: string, b: string): number {
  const aNum = /^\d+$/.test(a)
  const bNum = /^\d+$/.test(b)

  if (aNum && bNum) {
    return Number(a) - Number(b)
  }

  if (aNum) return -1
  if (bNum) return 1

  return a.localeCompare(b)
}

function compareVersions(a: string, b: string): number {
  const aNormalized = normalizeVersion(a)
  const bNormalized = normalizeVersion(b)

  const aCore = parseNumericCore(aNormalized)
  const bCore = parseNumericCore(bNormalized)
  const maxCoreLength = Math.max(aCore.length, bCore.length)

  for (let i = 0; i < maxCoreLength; i += 1) {
    const aPart = aCore[i] ?? 0
    const bPart = bCore[i] ?? 0

    if (aPart !== bPart) {
      return aPart - bPart
    }
  }

  const aPrerelease = aNormalized.split('-').slice(1).join('-')
  const bPrerelease = bNormalized.split('-').slice(1).join('-')

  if (!aPrerelease && !bPrerelease) return 0
  if (!aPrerelease) return 1
  if (!bPrerelease) return -1

  const aIdentifiers = aPrerelease.split('.')
  const bIdentifiers = bPrerelease.split('.')
  const maxIdentifiers = Math.max(aIdentifiers.length, bIdentifiers.length)

  for (let i = 0; i < maxIdentifiers; i += 1) {
    const aId = aIdentifiers[i]
    const bId = bIdentifiers[i]

    if (aId === undefined) return -1
    if (bId === undefined) return 1

    const cmp = comparePrereleaseIdentifiers(aId, bId)
    if (cmp !== 0) return cmp
  }

  return 0
}

function normalizeReleaseNotes(releaseNotes: unknown): string | null {
  if (typeof releaseNotes === 'string') {
    return releaseNotes
  }

  if (Array.isArray(releaseNotes)) {
    const notes = releaseNotes
      .map((entry) => {
        if (entry && typeof entry === 'object' && 'note' in entry) {
          const value = (entry as { note?: unknown }).note
          return typeof value === 'string' ? value : ''
        }

        return ''
      })
      .filter(Boolean)

    return notes.length ? notes.join('\n\n') : null
  }

  return null
}

export function setupUpdater(window: BrowserWindow | null) {
  if (!window) return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // IPC Handlers
  ipcMain.handle(IpcChannels.CheckForUpdates, async () => {
    if (is.dev) {
      // add mock up response
      return {
        files: [
          {
            url: 'https://github.com/victoralvesf/aonsoku/releases/download/v0.11.0/Aonsoku-v0.11.0-linux-x86_64.AppImage',
            sha512:
              'QRsm6JGcGxiFzngU5VK9LhN7AJlO1mTjXpZBpUFIb7CmmNyWtH7nmT+YjaaeHVdBLCQJRGZna6U9ZCVfag8CiA==',
            size: 126846979,
            blockMapSize: 133143,
          },
        ],
        version: '9.99.9',
        updateUrl: 'https://github.com/victoralvesf/aonsoku/releases',
        releaseDate: '2025-11-30T02:45:24.024Z',
        releaseNotes:
          '## New version available\n\n- New feature 1\n- New feature 2\n\n### Fixes\n\n- Fix 1\n- Fix 2',
      }
    }

    try {
      const result = await autoUpdater.checkForUpdates()
      const info = result?.updateInfo
      if (!info) return null

      const currentVersion = app.getVersion()
      const latestVersion = info.version

      // Return update info only for strictly newer versions.
      if (compareVersions(latestVersion, currentVersion) <= 0) {
        return null
      }

      return {
        ...info,
        releaseNotes: normalizeReleaseNotes(info.releaseNotes),
      }
    } catch (e) {
      console.error('Failed to check for updates:', e)
      return null
    }
  })

  ipcMain.on(IpcChannels.DownloadUpdate, () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on(IpcChannels.QuitAndInstall, () => {
    autoUpdater.quitAndInstall()
  })

  // Updater Events
  autoUpdater.on('checking-for-update', () => {
    // Optional: notify renderer if needed
  })

  autoUpdater.on('update-available', (info) => {
    window.webContents.send(IpcChannels.UpdateAvailable, info)
  })

  autoUpdater.on('update-not-available', () => {
    window.webContents.send(IpcChannels.UpdateNotAvailable)
  })

  autoUpdater.on('error', (err) => {
    window.webContents.send(IpcChannels.UpdateError, err.message)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    window.webContents.send(IpcChannels.DownloadProgress, progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    window.webContents.send(IpcChannels.UpdateDownloaded, info)
  })
}
