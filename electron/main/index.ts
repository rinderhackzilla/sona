import { electronApp, is, optimizer, platform } from '@electron-toolkit/utils'
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

function getRendererCsp(isDev: boolean) {
  const connectSrc = isDev
    ? "connect-src 'self' http: https: ws: wss: blob: data:;"
    : "connect-src 'self' http: https: blob: data:;"
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: blob:;"
    : "script-src 'self';"

  return [
    "default-src 'self';",
    "base-uri 'self';",
    "form-action 'self';",
    "frame-ancestors 'none';",
    "object-src 'none';",
    scriptSrc,
    "style-src 'self' 'unsafe-inline';",
    "img-src 'self' data: blob: http: https:;",
    "font-src 'self' data: http: https:;",
    "media-src 'self' blob: http: https:;",
    "worker-src 'self' blob:;",
    connectSrc,
  ].join(' ')
}

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

    // Harden CSP for renderer documents and keep media CORS scoped to media only.
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = details.responseHeaders ?? {}
      const nextHeaders: Record<string, string[]> = {}

      for (const [key, value] of Object.entries(responseHeaders)) {
        const lower = key.toLowerCase()
        if (lower === 'content-security-policy') continue
        if (lower === 'content-security-policy-report-only') continue

        if (details.resourceType === 'media') {
          if (lower === 'access-control-allow-origin') continue
          if (lower === 'access-control-allow-methods') continue
        }

        nextHeaders[key] = value
      }

      if (
        details.resourceType === 'mainFrame' ||
        details.resourceType === 'subFrame'
      ) {
        nextHeaders['Content-Security-Policy'] = [getRendererCsp(is.dev)]
      }

      if (details.resourceType === 'media') {
        nextHeaders['Access-Control-Allow-Origin'] = ['*']
        nextHeaders['Access-Control-Allow-Methods'] = ['GET, HEAD, OPTIONS']
      }

      callback({
        responseHeaders: nextHeaders,
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
