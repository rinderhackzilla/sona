import { useCallback, useEffect, useMemo, useRef } from 'react'

export function useTimeoutController() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (!timeoutRef.current) return
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const schedule = useCallback(
    (callback: () => void, delayMs: number) => {
      clear()
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        callback()
      }, delayMs)
    },
    [clear],
  )

  useEffect(() => clear, [clear])

  return useMemo(
    () => ({
      clear,
      schedule,
    }),
    [clear, schedule],
  )
}
