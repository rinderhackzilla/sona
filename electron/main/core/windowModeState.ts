import { Rectangle } from 'electron'
import { AonsokuStore } from './store'

interface WindowModeState {
  mainBounds?: Rectangle
  miniBounds?: Rectangle
  mainIsMaximized?: boolean
}

const windowModeStore = new AonsokuStore<WindowModeState>({
  name: 'window-mode-state',
  defaults: {},
})

function isValidBounds(bounds?: Rectangle | null): bounds is Rectangle {
  if (!bounds) return false
  return (
    Number.isFinite(bounds.x) &&
    Number.isFinite(bounds.y) &&
    Number.isFinite(bounds.width) &&
    Number.isFinite(bounds.height) &&
    bounds.width > 0 &&
    bounds.height > 0
  )
}

export function getStoredMainBounds() {
  const state = windowModeStore.store
  return isValidBounds(state.mainBounds) ? state.mainBounds : null
}

export function setStoredMainBounds(bounds: Rectangle) {
  if (!isValidBounds(bounds)) return
  windowModeStore.set('mainBounds', bounds)
}

export function getStoredMiniBounds() {
  const state = windowModeStore.store
  return isValidBounds(state.miniBounds) ? state.miniBounds : null
}

export function setStoredMiniBounds(bounds: Rectangle) {
  if (!isValidBounds(bounds)) return
  windowModeStore.set('miniBounds', bounds)
}

export function getStoredMainIsMaximized() {
  return Boolean(windowModeStore.get('mainIsMaximized'))
}

export function setStoredMainIsMaximized(value: boolean) {
  windowModeStore.set('mainIsMaximized', value)
}
