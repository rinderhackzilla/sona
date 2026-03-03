import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'

const STORAGE_KEY = 'sona.contextualOnboarding.v1'

type CoachState = {
  completed: boolean
}

const DEFAULT_STATE: CoachState = {
  completed: false,
}

const BUBBLES: Array<{
  id: 'session' | 'fullscreen' | 'dj'
  selector: string
  titleKey: string
  textKey: string
}> = [
  {
    id: 'session',
    selector: '[data-coach-id="session-mode"]',
    titleKey: 'onboarding.steps.session.title',
    textKey: 'onboarding.steps.session.text',
  },
  {
    id: 'fullscreen',
    selector: '[data-coach-id="fullscreen-cover"]',
    titleKey: 'onboarding.steps.fullscreen.title',
    textKey: 'onboarding.steps.fullscreen.text',
  },
  {
    id: 'dj',
    selector: '[data-coach-id="sona-dj"]',
    titleKey: 'onboarding.steps.dj.title',
    textKey: 'onboarding.steps.dj.text',
  },
]

function parseState(): CoachState {
  const raw = safeStorageGet(STORAGE_KEY)
  if (!raw) return DEFAULT_STATE
  try {
    const parsed = JSON.parse(raw) as Partial<CoachState>
    return {
      completed: parsed.completed ?? false,
    }
  } catch {
    return DEFAULT_STATE
  }
}

function persistState(state: CoachState) {
  safeStorageSet(STORAGE_KEY, JSON.stringify(state))
}

export function ContextualOnboarding() {
  const { t } = useTranslation()
  const [state, setState] = useState<CoachState>(() => parseState())
  const [, setTick] = useState(0)

  useEffect(() => {
    if (state.completed) return

    let frameId: number | null = null
    const scheduleReflow = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(() => {
        frameId = null
        setTick((value) => value + 1)
      })
    }

    const resizeObserver = new ResizeObserver(scheduleReflow)
    resizeObserver.observe(document.body)

    const mutationObserver = new MutationObserver(scheduleReflow)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    window.addEventListener('resize', scheduleReflow)
    window.addEventListener('scroll', scheduleReflow, true)
    scheduleReflow()

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', scheduleReflow)
      window.removeEventListener('scroll', scheduleReflow, true)
    }
  }, [state.completed])

  const targets = (() => {
    if (state.completed) return null
    const resolved = BUBBLES.map((bubble) => {
      const element = document.querySelector(
        bubble.selector,
      ) as HTMLElement | null
      if (!element) return null
      return { bubble, element, rect: element.getBoundingClientRect() }
    })
    if (resolved.some((item) => item === null)) return null
    return resolved.filter(Boolean) as Array<{
      bubble: (typeof BUBBLES)[number]
      element: HTMLElement
      rect: DOMRect
    }>
  })()

  const closeTour = useCallback(() => {
    const nextState: CoachState = { completed: true }
    setState(nextState)
    persistState(nextState)
  }, [])

  useEffect(() => {
    if (!targets) return
    const handlePointerDown = () => closeTour()
    window.addEventListener('pointerdown', handlePointerDown, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [targets, closeTour])

  if (!targets) return null

  const getPlacement = (rect: DOMRect) => {
    const placeBelow = rect.top < 140
    const top = placeBelow ? rect.bottom + 14 : rect.top - 110
    const left = Math.max(
      12,
      Math.min(window.innerWidth - 284, rect.left + rect.width / 2 - 136),
    )
    return {
      top: Math.max(8, Math.min(window.innerHeight - 120, top)),
      left,
      arrowClass: placeBelow
        ? 'absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-border/70 bg-background/95'
        : 'absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b border-border/70 bg-background/95',
    }
  }

  const sortedTargets = [...targets].sort((a, b) => a.rect.left - b.rect.left)

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {sortedTargets.map(({ bubble, rect }) => {
        const placement = getPlacement(rect)
        return (
          <div
            key={bubble.id}
            className="pointer-events-auto absolute w-[272px] rounded-xl border border-border/70 bg-background/95 px-3.5 py-3 shadow-2xl backdrop-blur-sm"
            style={{ top: placement.top, left: placement.left }}
            onClick={closeTour}
          >
            <div className={placement.arrowClass} />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {t('onboarding.label', 'Quick tour')}
            </p>
            <h4 className="mt-1 text-sm font-semibold leading-tight text-foreground">
              {t(bubble.titleKey)}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t(bubble.textKey)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
