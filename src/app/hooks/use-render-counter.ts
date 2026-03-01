import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    __sonaRenderCounters?: Record<string, number>
  }
}

const DEV_ONLY = import.meta.env.DEV

export function useRenderCounter(name: string) {
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!DEV_ONLY) return
    if (!window.__sonaRenderCounters) {
      window.__sonaRenderCounters = {}
    }

    if (!mountedRef.current) {
      mountedRef.current = true
    }
    window.__sonaRenderCounters[name] = (window.__sonaRenderCounters[name] ?? 0) + 1
  })
}

export function readRenderCounters() {
  if (!DEV_ONLY) return {}
  return window.__sonaRenderCounters ?? {}
}
