import { is, platform } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain, nativeTheme, session, shell } from 'electron'
import { electron } from '../../../package.json'
import {
  IpcChannels,
  OverlayColors,
  PlayerStatePayload,
} from '../../preload/types'
import { tray, updateTray } from '../tray'
import { colorsState } from './colors'
import {
  clearDiscordRpcActivity,
  RpcPayload,
  setDiscordRpcActivity,
} from './discordRpc'
import { playerState } from './playerState'
import { getAppSetting, ISettingPayload, saveAppSettings } from './settings'
import { setTaskbarButtons } from './taskbar'
import {
  DEFAULT_TITLE_BAR_HEIGHT,
  hiddenTitleBarOverlay,
  titleBarOverlay,
} from './titleBarOverlay'
import {
  getStoredMainBounds,
  getStoredMainIsMaximized,
  getStoredMiniBounds,
  setStoredMainBounds,
  setStoredMainIsMaximized,
  setStoredMiniBounds,
} from './windowModeState'

export function setupEvents(window: BrowserWindow | null) {
  if (!window) return

  window.on('ready-to-show', async () => {
    window.show()
  })

  window.on('show', () => {
    setTaskbarButtons()
    updateTray()
  })

  window.on('hide', () => {
    updateTray()
  })

  window.webContents.once('did-finish-load', () => {
    nativeTheme.on('updated', () => {
      setTaskbarButtons()
    })
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  window.on('enter-full-screen', () => {
    window.webContents.send(IpcChannels.FullscreenStatus, true)
  })

  window.on('leave-full-screen', () => {
    window.webContents.send(IpcChannels.FullscreenStatus, false)
  })

  window.on('maximize', () => {
    window.webContents.send(IpcChannels.MaximizedStatus, true)
  })

  window.on('unmaximize', () => {
    window.webContents.send(IpcChannels.MaximizedStatus, false)
  })

  window.on('close', (event) => {
    if (is.dev || !getAppSetting('minimizeToTray')) {
      if (tray && !tray.isDestroyed()) tray.destroy()
      return
    }

    event.preventDefault()
    window.hide()
  })

  window.on('page-title-updated', (_, title) => {
    updateTray(title)
  })
}

export function setupIpcEvents(window: BrowserWindow | null) {
  if (!window) return

  ipcMain.removeAllListeners()
  const { defaultWidth, defaultHeight } = electron.window
  const mainMinWidth = Math.max(defaultWidth, 1300)
  const miniWidth = 384
  const miniHeight = 192

  let miniPlayerPrevBounds = window.getBounds()
  let miniPlayerPrevMaximized = window.isMaximized()
  let miniPlayerPrevMinimizable = window.isMinimizable()
  let miniPlayerPrevMaximizable = window.isMaximizable()
  let miniPlayerPrevResizable = window.isResizable()
  let miniPlayerPrevClosable = window.isClosable()
  let miniPlayerPrevFullScreenable = window.isFullScreenable()
  let miniPlayerLastBounds: Electron.Rectangle | null = null
  let restoreTitleBarOverlayTimer: ReturnType<typeof setTimeout> | null = null
  let restoreMouseEventsTimer: ReturnType<typeof setTimeout> | null = null
  let isMiniPlayerMode = false

  window.on('close', () => {
    if (isMiniPlayerMode) {
      setStoredMiniBounds(window.getBounds())
      return
    }

    const mainBounds = window.isMaximized()
      ? window.getNormalBounds()
      : window.getBounds()
    setStoredMainBounds(mainBounds)
    setStoredMainIsMaximized(window.isMaximized())
  })

  ipcMain.on(IpcChannels.ToggleFullscreen, (_, isFullscreen: boolean) => {
    window.setFullScreen(isFullscreen)
  })

  ipcMain.removeHandler(IpcChannels.IsFullScreen)
  ipcMain.handle(IpcChannels.IsFullScreen, () => {
    return window.isFullScreen()
  })

  ipcMain.removeHandler(IpcChannels.IsMaximized)
  ipcMain.handle(IpcChannels.IsMaximized, () => {
    return window.isMaximized()
  })

  ipcMain.removeHandler(IpcChannels.ClearAppCache)
  ipcMain.handle(IpcChannels.ClearAppCache, async () => {
    try {
      await session.defaultSession.clearCache()
      return true
    } catch {
      return false
    }
  })

  ipcMain.on(IpcChannels.ToggleMaximize, (_, isMaximized: boolean) => {
    if (isMaximized) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  })

  ipcMain.on(IpcChannels.ToggleMinimize, () => {
    window.minimize()
  })

  ipcMain.on(IpcChannels.CloseWindow, () => {
    window.close()
  })

  ipcMain.on(IpcChannels.ThemeChanged, (_, colors: OverlayColors) => {
    const { color, symbol, bgColor } = colors

    if (bgColor) {
      colorsState.set('bgColor', bgColor)
    }

    if (platform.isMacOS || platform.isLinux) return

    window.setTitleBarOverlay({
      color,
      height: DEFAULT_TITLE_BAR_HEIGHT,
      symbolColor: symbol,
    })
  })

  ipcMain.on(IpcChannels.UpdateNativeTheme, (_, isDark: boolean) => {
    nativeTheme.themeSource = isDark ? 'dark' : 'light'
  })

  ipcMain.on(
    IpcChannels.UpdatePlayerState,
    (_, payload: PlayerStatePayload) => {
      playerState.setAll(payload)

      setTimeout(() => {
        setTaskbarButtons()
        updateTray()
      }, 150)
    },
  )

  ipcMain.on(IpcChannels.SetDiscordRpcActivity, (_, payload: RpcPayload) => {
    setDiscordRpcActivity(payload)
  })

  ipcMain.on(IpcChannels.ClearDiscordRpcActivity, () => {
    clearDiscordRpcActivity()
  })

  ipcMain.on(IpcChannels.SaveAppSettings, (_, payload: ISettingPayload) => {
    saveAppSettings(payload)
  })

  ipcMain.on(IpcChannels.SetMiniPlayerMode, (_, enabled: boolean) => {
    if (enabled) {
      isMiniPlayerMode = true
      if (restoreTitleBarOverlayTimer) {
        clearTimeout(restoreTitleBarOverlayTimer)
        restoreTitleBarOverlayTimer = null
      }
      if (restoreMouseEventsTimer) {
        clearTimeout(restoreMouseEventsTimer)
        restoreMouseEventsTimer = null
      }
      window.setIgnoreMouseEvents(false)
      miniPlayerPrevBounds = window.getBounds()
      miniPlayerPrevMaximized = window.isMaximized()
      miniPlayerPrevMinimizable = window.isMinimizable()
      miniPlayerPrevMaximizable = window.isMaximizable()
      miniPlayerPrevResizable = window.isResizable()
      miniPlayerPrevClosable = window.isClosable()
      miniPlayerPrevFullScreenable = window.isFullScreenable()

      const mainBounds = miniPlayerPrevMaximized
        ? window.getNormalBounds()
        : miniPlayerPrevBounds
      setStoredMainBounds(mainBounds)
      setStoredMainIsMaximized(miniPlayerPrevMaximized)

      if (window.isFullScreen()) {
        window.setFullScreen(false)
      }
      if (window.isMaximized()) {
        window.unmaximize()
      }

      window.setMinimumSize(miniWidth, miniHeight)
      window.setMinimizable(false)
      window.setMaximizable(false)
      window.setResizable(false)
      window.setClosable(false)
      window.setFullScreenable(false)
      if (platform.isWindows) {
        window.setTitleBarOverlay(hiddenTitleBarOverlay)
      }
      const persistedMiniBounds = getStoredMiniBounds()
      const targetMiniBounds = persistedMiniBounds ?? miniPlayerLastBounds
      if (targetMiniBounds) {
        window.setBounds(
          {
            x: targetMiniBounds.x,
            y: targetMiniBounds.y,
            width: miniWidth,
            height: miniHeight,
          },
          true,
        )
      } else {
        window.setSize(miniWidth, miniHeight, true)
        window.center()
      }
      return
    }

    isMiniPlayerMode = false
    miniPlayerLastBounds = window.getBounds()
    setStoredMiniBounds(miniPlayerLastBounds)
    window.setAlwaysOnTop(false)
    window.setMinimumSize(mainMinWidth, defaultHeight)
    window.setMinimizable(miniPlayerPrevMinimizable)
    window.setMaximizable(miniPlayerPrevMaximizable)
    window.setResizable(miniPlayerPrevResizable)
    window.setClosable(miniPlayerPrevClosable)
    window.setFullScreenable(miniPlayerPrevFullScreenable)
    if (platform.isWindows) {
      window.setTitleBarOverlay(hiddenTitleBarOverlay)
    }

    const persistedMainBounds = getStoredMainBounds()
    const persistedMainIsMaximized = getStoredMainIsMaximized()
    const shouldMaximize = miniPlayerPrevMaximized || persistedMainIsMaximized
    if (shouldMaximize) {
      window.maximize()
      return
    }

    if (miniPlayerPrevBounds.width > 0 && miniPlayerPrevBounds.height > 0) {
      window.setBounds(
        {
          ...miniPlayerPrevBounds,
          width: Math.max(miniPlayerPrevBounds.width, mainMinWidth),
        },
        true,
      )
    } else if (persistedMainBounds) {
      window.setBounds(
        {
          ...persistedMainBounds,
          width: Math.max(persistedMainBounds.width, mainMinWidth),
        },
        true,
      )
    } else {
      window.setSize(mainMinWidth, defaultHeight, true)
      window.center()
    }

    // Prevent click-through from the expand button into native title controls.
    window.setIgnoreMouseEvents(true)
    restoreMouseEventsTimer = setTimeout(() => {
      window.setIgnoreMouseEvents(false)
    }, 260)

    if (platform.isWindows) {
      restoreTitleBarOverlayTimer = setTimeout(() => {
        window.setTitleBarOverlay(titleBarOverlay)
      }, 520)
    }
  })

  ipcMain.on(IpcChannels.SetMiniPlayerPinned, (_, pinned: boolean) => {
    window.setAlwaysOnTop(pinned)
  })
}
