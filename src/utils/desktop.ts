import { isElectron, osName } from 'react-device-detect'

function isCypress(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window as { Cypress?: unknown }).Cypress !== undefined
  )
}

function hasDesktopApi(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.api?.setMiniPlayerMode === 'function'
  )
}

export function isDesktop(): boolean {
  return !isCypress() && (hasDesktopApi() || isElectron)
}

export const isDeviceLinux = osName === 'Linux'
export const isDeviceMacOS = osName === 'Mac OS'
export const isDeviceWindows = osName === 'Windows'

export const isLinux = isDesktop() ? isDeviceLinux : false
export const isMacOS = isDesktop() ? isDeviceMacOS : false
export const isWindows = isDesktop() ? isDeviceWindows : false
