import { useCallback, useEffect, useRef, useState } from 'react'
import { useTimeoutController } from '@/app/hooks/use-timeout-controller'

export function useFullscreenChromeVisibility(delayMs = 3000) {
  const [isChromeVisible, setIsChromeVisible] = useState(true)
  const isChromeVisibleRef = useRef(true)
  const { clear: clearHideTimer, schedule: scheduleHideTimer } =
    useTimeoutController()

  const scheduleHideChrome = useCallback(() => {
    scheduleHideTimer(() => {
      isChromeVisibleRef.current = false
      setIsChromeVisible(false)
    }, delayMs)
  }, [delayMs, scheduleHideTimer])

  const revealChrome = useCallback(() => {
    if (!isChromeVisibleRef.current) {
      isChromeVisibleRef.current = true
      setIsChromeVisible(true)
    }
    scheduleHideChrome()
  }, [scheduleHideChrome])

  useEffect(() => {
    scheduleHideChrome()
    return () => clearHideTimer()
  }, [clearHideTimer, scheduleHideChrome])

  return {
    isChromeVisible,
    revealChrome,
    scheduleHideChrome,
  }
}
