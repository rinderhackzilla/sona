export const DEFAULT_TITLE_BAR_COLOR = '#ff000000'
export const DEFAULT_TITLE_BAR_HEIGHT = 43

export const titleBarOverlay: Electron.TitleBarOverlay = {
  color: DEFAULT_TITLE_BAR_COLOR,
  symbolColor: '#ffffff',
  height: DEFAULT_TITLE_BAR_HEIGHT,
}

export const hiddenTitleBarOverlay: Electron.TitleBarOverlay = {
  color: '#00000000',
  symbolColor: '#00000000',
  height: 0,
}
