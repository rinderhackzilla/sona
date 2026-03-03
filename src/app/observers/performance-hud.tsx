import { useEffect, useMemo, useRef, useState } from 'react'
import { readRenderCounters } from '@/app/hooks/use-render-counter'
import { logger } from '@/utils/logger'
import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'

const DEV_ONLY = import.meta.env.DEV
const HUD_STORAGE_KEY = 'sona.dev.perfHud'

type PerfStats = {
  fps: number
  longTasks: number
  renders: Record<string, number>
}

export function PerformanceHud() {
  const enabledByDefault = useMemo(() => {
    if (!DEV_ONLY) return false
    return safeStorageGet(HUD_STORAGE_KEY) === '1'
  }, [])
  const [enabled, setEnabled] = useState(enabledByDefault)
  const [stats, setStats] = useState<PerfStats>({
    fps: 0,
    longTasks: 0,
    renders: {},
  })
  const latestFpsRef = useRef(0)
  const latestLongTasksRef = useRef(0)

  useEffect(() => {
    if (!DEV_ONLY) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'h'))
        return
      event.preventDefault()
      setEnabled((prev) => {
        const next = !prev
        safeStorageSet(HUD_STORAGE_KEY, next ? '1' : '0')
        return next
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!DEV_ONLY) return

    let rafId = 0
    let frameCount = 0
    let lastTs = performance.now()
    let lowFpsStreak = 0
    let longTaskCount = 0

    const perfObserver =
      typeof window.PerformanceObserver !== 'undefined'
        ? new window.PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'longtask' && entry.duration > 120) {
                logger.warn('[Perf] Long task', {
                  durationMs: Math.round(entry.duration),
                  name: entry.name,
                })
                longTaskCount += 1
              }
            }
          })
        : null

    try {
      perfObserver?.observe({ entryTypes: ['longtask'] })
    } catch {
      // no-op
    }

    const tick = (ts: number) => {
      frameCount += 1
      const delta = ts - lastTs
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta)
        latestFpsRef.current = fps
        latestLongTasksRef.current = longTaskCount
        if (fps < 45) {
          lowFpsStreak += 1
          if (lowFpsStreak >= 2) {
            logger.warn('[Perf] Low FPS detected', { fps })
          }
        } else {
          lowFpsStreak = 0
        }
        frameCount = 0
        longTaskCount = 0
        lastTs = ts
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      perfObserver?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => {
      setStats({
        fps: latestFpsRef.current,
        longTasks: latestLongTasksRef.current,
        renders: readRenderCounters(),
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [enabled])

  if (!DEV_ONLY || !enabled) return null

  return (
    <div className="pointer-events-none fixed right-3 top-[calc(var(--header-height)+8px)] z-[120] rounded-md border border-border/60 bg-background/75 px-2 py-1 text-[11px] font-medium text-foreground/90 backdrop-blur-sm">
      <div>FPS: {stats.fps}</div>
      <div>Long tasks: {stats.longTasks}</div>
      <div>
        Renders:{' '}
        {Object.entries(stats.renders)
          .map(([name, count]) => `${name}:${count}`)
          .join(' | ') || '-'}
      </div>
    </div>
  )
}
