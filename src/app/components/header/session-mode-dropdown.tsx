import { MoonStar, Sparkles, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { usePlayerActions, useSessionModeSettings } from '@/store/player.store'
import { useTheme } from '@/store/theme.store'
import { SessionMode } from '@/types/playerContext'
import { Theme } from '@/types/themeContext'

type ModeId = SessionMode

const SESSION_PREVIOUS_THEME_KEY = 'sona.session.previousTheme'
const LAST_NON_SESSION_THEME_KEY = 'sona.theme.lastNonSession'

const modeThemeMap: Record<Exclude<ModeId, 'off'>, Theme> = {
  focus: Theme.Black,
  night: Theme.NuclearDark,
}

function openInAppFullscreenWithRetry(tries = 4, delayMs = 180) {
  const trigger = document.querySelector(
    '[data-testid=\"track-fullscreen-button\"]',
  ) as HTMLButtonElement | null

  if (trigger && !trigger.disabled) {
    trigger.click()
    return
  }

  if (tries <= 0) return
  window.setTimeout(() => openInAppFullscreenWithRetry(tries - 1, delayMs), delayMs)
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(SESSION_PREVIOUS_THEME_KEY)
  if (!value) return null
  return Object.values(Theme).includes(value as Theme) ? (value as Theme) : null
}

function getLastNonSessionTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(LAST_NON_SESSION_THEME_KEY)
  if (!value) return null
  return Object.values(Theme).includes(value as Theme) ? (value as Theme) : null
}

export function SessionModeDropdown() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { startSessionMode } = usePlayerActions()
  const { mode } = useSessionModeSettings()
  const { theme, setTheme } = useTheme()
  const isActive = mode !== 'off'

  const statusLabel = useMemo(() => {
    if (mode === 'focus') return t('sessionMode.focus.label', 'Focus')
    if (mode === 'night') return t('sessionMode.night.label', 'Night')
    return t('sessionMode.normal.label', 'Normal')
  }, [mode, t])

  const StatusIcon = mode === 'focus' ? Target : mode === 'night' ? MoonStar : Sparkles

  const selectMode = (selected: ModeId) => {
    const previousMode = mode
    if (selected === 'off') {
      const previousTheme = getStoredTheme()
      const fallbackTheme = getLastNonSessionTheme()
      setTheme(previousTheme ?? fallbackTheme ?? theme ?? Theme.Dark)
      if (mode === 'focus') {
        const closeButton = document.querySelector(
          '[data-testid=\"fullscreen-close-button\"]',
        ) as HTMLButtonElement | null
        closeButton?.click()
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('sona.fullscreen.hypnoticBackdrop', 'false')
      }
      startSessionMode('off').catch(() => undefined)
      return
    }

    if (mode === 'off' && typeof window !== 'undefined') {
      window.localStorage.setItem(SESSION_PREVIOUS_THEME_KEY, theme)
    }

    setTheme(modeThemeMap[selected])
    if (selected === 'focus') {
      openInAppFullscreenWithRetry()
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('sona.fullscreen.hypnoticBackdrop', 'false')
      }
    }
    if (selected === 'night' && typeof window !== 'undefined') {
      window.localStorage.setItem('sona.fullscreen.hypnoticBackdrop', 'true')
    }
    startSessionMode(selected).catch(() => undefined)
    if (selected !== previousMode) {
      toast.info(
        selected === 'focus'
          ? t('sessionMode.toasts.focusEnabled', 'Focus Mode enabled')
          : t('sessionMode.toasts.nightEnabled', 'Night Mode enabled'),
      )
    }
  }

  const disableCurrentMode = () => {
    selectMode('off')
    toast.info(
      mode === 'focus'
        ? t('sessionMode.toasts.focusDisabled', 'Focus Mode disabled')
        : t('sessionMode.toasts.nightDisabled', 'Night Mode disabled'),
    )
  }

  const modeCardClass = (target: ModeId) => {
    const active = mode === target
    if (active) {
      return 'border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]'
    }
    return 'border-border bg-card/50 hover:border-primary/40 hover:bg-card'
  }

  const closeModalSafely = () => {
    const activeElement = document.activeElement as HTMLElement | null
    activeElement?.blur()
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (isActive) {
            disableCurrentMode()
            return
          }
          setOpen(true)
        }}
        className={`h-8 gap-1.5 rounded-md px-2 transition-all ${
          isActive
            ? 'border border-primary/50 bg-primary/14 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.22)]'
            : 'text-muted-foreground'
        }`}
      >
        <StatusIcon className="h-4 w-4" />
        {isActive && (
          <>
            <span className="text-[11px] font-semibold tracking-wide uppercase">
              {statusLabel}
            </span>
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('sessionMode.label', 'Session Mode')}</DialogTitle>
            <DialogDescription>
              {t(
                'sessionMode.description',
                'Switch playback mood and visuals in one click.',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              className={`rounded-lg border p-4 text-left transition-colors ${modeCardClass('focus')}`}
              onClick={() => {
                selectMode('focus')
                closeModalSafely()
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="font-medium">
                  {t('sessionMode.focus.label', 'Focus')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('sessionMode.focus.info', 'Calm, low-distraction flow')}
              </p>
            </button>

            <button
              type="button"
              className={`rounded-lg border p-4 text-left transition-colors ${modeCardClass('night')}`}
              onClick={() => {
                selectMode('night')
                closeModalSafely()
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <MoonStar className="h-4 w-4" />
                <span className="font-medium">
                  {t('sessionMode.night.label', 'Night')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('sessionMode.night.info', 'Atmospheric late-hour rotation')}
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
