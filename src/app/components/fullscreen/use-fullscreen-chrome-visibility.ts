import { useCallback, useEffect, useRef, useState } from 'react'

export function useFullscreenChromeVisibility(
  delayMs = 3000,
  suspendAutoHide = false,
) {
  const [isChromeVisible, setIsChromeVisible] = useState(true)
  const isChromeVisibleRef = useRef(true)
  const lastActivityTsRef = useRef(performance.now())

  const revealChrome = useCallback(() => {
    lastActivityTsRef.current = performance.now()
    if (!isChromeVisibleRef.current) {
      isChromeVisibleRef.current = true
      setIsChromeVisible(true)
    }
  }, [])

  const scheduleHideChrome = useCallback(() => {
    lastActivityTsRef.current = performance.now()
  }, [])

  useEffect(() => {
    if (suspendAutoHide) {
      if (!isChromeVisibleRef.current) {
        isChromeVisibleRef.current = true
        setIsChromeVisible(true)
      }
      return
    }

    const intervalId = window.setInterval(() => {
      const inactiveForMs = performance.now() - lastActivityTsRef.current

      if (inactiveForMs >= delayMs && isChromeVisibleRef.current) {
        isChromeVisibleRef.current = false
        setIsChromeVisible(false)
        return
      }

      if (inactiveForMs < delayMs && !isChromeVisibleRef.current) {
        isChromeVisibleRef.current = true
        setIsChromeVisible(true)
      }
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [delayMs, suspendAutoHide])

  useEffect(() => {
    if (suspendAutoHide) return

    const onPointerMove = () => {
      // Hot path: update timestamp only, avoid timer churn.
      lastActivityTsRef.current = performance.now()
    }

    const onActivity = () => {
      revealChrome()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('wheel', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('wheel', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [revealChrome, suspendAutoHide])

  return {
    isChromeVisible,
    revealChrome,
    scheduleHideChrome,
  }
}
