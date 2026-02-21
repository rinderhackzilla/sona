import { electronApp, optimizer, platform } from '@electron-toolkit/utils'
import { app, globalShortcut, session } from 'electron'
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
    electronApp.setAppUserModelId('com.victoralvesf.aonsoku')

    // Inject CORS headers so the Web Audio API can connect to the audio stream.
    // Subsonic servers typically don't send CORS headers, which blocks
    // createMediaElementSource() even with crossOrigin="anonymous" on the element.
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
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
