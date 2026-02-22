import { electronApp, optimizer, platform } from '@electron-toolkit/utils'
import { app, globalShortcut, session } from 'electron'
import { APP_ID } from './core/app-id'
import { createAppMenu } from './core/menu'
import { createWindow, mainWindow } from './window'
import { startDiscoverWeeklyScheduler } from '../discover-weekly-scheduler'

const currentDesktop = process.env.XDG_CURRENT_DESKTOP ?? ''

if (platform.isLinux && currentDesktop.toLowerCase().includes('gnome')) {
  process.env.XDG_CURRENT_DESKTOP = 'Unity'
}

const instanceLock = app.requestSingleInstanceLock()

if (!instanceLock) {
  app.quit()
} else {
  createAppMenu()

  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    } else if (!mainWindow.isVisible()) {
      mainWindow.show()
    }

    mainWindow.focus()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId(APP_ID)

    // Recover from broken Chromium disk cache states that can cause
    // random missing images on startup.
    session.defaultSession.clearCache().catch(() => {})

    // Inject CORS headers only for media streams so Web Audio can attach
    // createMediaElementSource() without polluting non-media API responses.
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      if (details.resourceType !== 'media') {
        callback({ responseHeaders: details.responseHeaders ?? {} })
        return
      }

      const responseHeaders = details.responseHeaders ?? {}
      const nextHeaders: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(responseHeaders)) {
        const lower = key.toLowerCase()
        if (lower === 'access-control-allow-origin') continue
        if (lower === 'access-control-allow-methods') continue
        nextHeaders[key] = value
      }

      callback({
        responseHeaders: {
          ...nextHeaders,
          'Access-Control-Allow-Origin': ['*'],
          'Access-Control-Allow-Methods': ['GET, HEAD, OPTIONS'],
        },
      })
    })

    createWindow()
    
    // Start Discover Weekly background scheduler
    startDiscoverWeeklyScheduler()
  })

  app.on('activate', function () {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow()
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    } else if (!mainWindow.isVisible()) {
      mainWindow.show()
    }

    mainWindow.focus()
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
    globalShortcut.register('F11', () => {})
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
