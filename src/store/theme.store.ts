import merge from 'lodash/merge'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'
import { IThemeContext, Theme } from '@/types/themeContext'
import { getValidThemeFromEnv } from '@/utils/theme'

const appThemeFromEnv = getValidThemeFromEnv()
const VALID_THEMES = new Set(Object.values(Theme))
const SESSION_PREVIOUS_THEME_KEY = 'sona.session.previousTheme'
const LAST_NON_SESSION_THEME_KEY = 'sona.theme.lastNonSession'
const SESSION_THEMES = new Set<Theme>([Theme.Black, Theme.NuclearDark])

const sanitizeTheme = (value: unknown): Theme =>
  VALID_THEMES.has(value as Theme) ? (value as Theme) : Theme.Dark

export const useThemeStore = createWithEqualityFn<IThemeContext>()(
  subscribeWithSelector(
    persist(
      devtools(
        immer((set) => ({
          theme: sanitizeTheme(appThemeFromEnv || Theme.Dark),
          setTheme: (theme: Theme) => {
            set((state) => {
              state.theme = theme
            })
            if (typeof window !== 'undefined' && !SESSION_THEMES.has(theme)) {
              window.localStorage.setItem(LAST_NON_SESSION_THEME_KEY, theme)
            }
          },
        })),
        {
          name: 'theme_store',
        },
      ),
      {
        name: 'theme_store',
        version: 1,
        merge: (persistedState, currentState) => {
          if (appThemeFromEnv) {
            if (persistedState && typeof persistedState === 'object') {
              persistedState = {
                ...persistedState,
                theme: sanitizeTheme(appThemeFromEnv),
              }
            }
          }

          const merged = merge(currentState, persistedState)
          let resolvedTheme = sanitizeTheme((merged as IThemeContext).theme)

          // If the app boots in normal session mode but still has a temporary
          // session theme, restore the user's previous theme automatically.
          if (typeof window !== 'undefined' && SESSION_THEMES.has(resolvedTheme)) {
            const previousTheme = window.localStorage.getItem(SESSION_PREVIOUS_THEME_KEY)
            if (previousTheme && VALID_THEMES.has(previousTheme as Theme)) {
              resolvedTheme = previousTheme as Theme
              window.localStorage.removeItem(SESSION_PREVIOUS_THEME_KEY)
            }
          }

          if (
            typeof window !== 'undefined' &&
            !SESSION_THEMES.has(resolvedTheme)
          ) {
            window.localStorage.setItem(LAST_NON_SESSION_THEME_KEY, resolvedTheme)
          }

          return {
            ...merged,
            theme: resolvedTheme,
          }
        },
      },
    ),
  ),
)

export const useTheme = () => useThemeStore((state) => state)
