import { Theme } from '@/types/themeContext'
import { SessionMode } from '@/types/playerContext'

export const SESSION_MODE_VALUES = ['off', 'focus', 'night'] as const satisfies readonly SessionMode[]

export const SESSION_MODE_THEMES: Record<Exclude<SessionMode, 'off'>, Theme> = {
  focus: Theme.Black,
  night: Theme.NuclearDark,
}
