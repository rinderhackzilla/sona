import { useCallback, useEffect, useRef, useState } from 'react'
import { useTimeoutController } from '@/app/hooks/use-timeout-controller'

export function useFullscreenChromeVisibility(
  delayMs = 3000,
  suspendAutoHide = false,
) {
  const [isChromeVisible, setIsChromeVisible] = useState(true)
  const isChromeVisibleRef = useRef(true)
  const { clear: clearHideTimer, schedule: scheduleHideTimer } =
    useTimeoutController()

  const scheduleHideChrome = useCallback(() => {
    if (suspendAutoHide) {
      isChromeVisibleRef.current = true
      setIsChromeVisible(true)
      clearHideTimer()
      return
    }
    scheduleHideTimer(() => {
      isChromeVisibleRef.current = false
      setIsChromeVisible(false)
    }, delayMs)
  }, [clearHideTimer, delayMs, scheduleHideTimer, suspendAutoHide])

  const revealChrome = useCallback(() => {
    if (!isChromeVisibleRef.current) {
      isChromeVisibleRef.current = true
      setIsChromeVisible(true)
    }
    scheduleHideChrome()
  }, [scheduleHideChrome])

  useEffect(() => {
    if (suspendAutoHide) {
      isChromeVisibleRef.current = true
      setIsChromeVisible(true)
      clearHideTimer()
      return
    }
    scheduleHideChrome()
    return () => clearHideTimer()
  }, [clearHideTimer, scheduleHideChrome, suspendAutoHide])

  return {
    isChromeVisible,
    revealChrome,
    scheduleHideChrome,
  }
}
