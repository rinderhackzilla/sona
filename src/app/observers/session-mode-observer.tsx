import { useEffect } from 'react'
import { useSessionModeSettings } from '@/store/player.store'

export function SessionModeObserver() {
  const { mode } = useSessionModeSettings()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('session-mode-focus', 'session-mode-night')

    if (mode === 'focus') root.classList.add('session-mode-focus')
    if (mode === 'night') root.classList.add('session-mode-night')
  }, [mode])

  return null
}
