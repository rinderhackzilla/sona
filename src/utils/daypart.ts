import type { DayPart } from '@/service/time-of-day-playlist'

export const DAYPART_KEYS: DayPart[] = [
  'morning',
  'noon',
  'afternoon',
  'evening',
  'night',
]

export function getDaypartNameKey(dayPart: DayPart) {
  return `home.daypart.names.${dayPart}`
}

export function getDaypartMoodKey(dayPart: DayPart) {
  return `home.daypart.moods.${dayPart}`
}

