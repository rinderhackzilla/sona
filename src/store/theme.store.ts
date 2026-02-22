import merge from 'lodash/merge'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'
import { IThemeContext, Theme } from '@/types/themeContext'
import { getValidThemeFromEnv } from '@/utils/theme'

const appThemeFromEnv = getValidThemeFromEnv()
const VALID_THEMES = new Set(Object.values(Theme))

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

          return {
            ...merged,
            theme: sanitizeTheme((merged as IThemeContext).theme),
          }
        },
      },
    ),
  ),
)

export const useTheme = () => useThemeStore((state) => state)
