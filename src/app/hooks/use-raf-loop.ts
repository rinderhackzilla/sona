import { type DependencyList, useEffect, useRef } from 'react'

export function useRafLoop(
  callback: () => void,
  enabled: boolean,
  deps: DependencyList = [],
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    let rafId = 0
    const tick = () => {
      callbackRef.current()
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [enabled, ...deps])
}
