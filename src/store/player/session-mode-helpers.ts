import { SessionMode } from '@/types/playerContext'
import { ISong } from '@/types/responses/song'
import { isGenreUsable, normalizeGenreName } from '@/utils/genreNormalization'

export const DEFAULT_FOCUS_GENRES = [
  'classical',
  'soundtracks',
  'soundtrack',
  'neo classical',
  'film score',
  'film scores',
  'game soundtrack',
  'score',
  'films',
  'video game music',
]

export const DEFAULT_NIGHT_GENRES = [
  'electronic',
  'synthwave',
  'trip hop',
  'metalcore',
  'post-hardcore',
  'industrial',
  'industrial metal',
  'progressive metal',
  'progressive metalcore',
  'gothic rock',
  'gothic metal',
  'doom metal',
  'sludge metal',
]

const focusGenres = new Set(DEFAULT_FOCUS_GENRES)
const nightGenres = new Set(DEFAULT_NIGHT_GENRES)

export function normalizeGenre(value?: string) {
  return (value ?? '').trim().toLowerCase()
}

export function splitGenreCandidates(rawGenre?: string): string[] {
  const raw = (rawGenre ?? '').trim()
  if (!raw) return []

  const parts = raw
    .split(/[,&/]| and | und /i)
    .map((value) => value.trim())
    .filter(Boolean)

  const mapped = new Set<string>()
  for (const part of parts) {
    mapped.add(part.toLowerCase())
    const canonical = normalizeGenreName(part).trim()
    if (!canonical) continue
    if (!isGenreUsable(canonical)) continue
    mapped.add(canonical.toLowerCase())
  }

  const direct = normalizeGenreName(raw).trim().toLowerCase()
  if (direct && isGenreUsable(direct)) mapped.add(direct)

  return [...mapped]
}

export function getSessionGenreSet(
  mode: SessionMode,
  focusGenreList?: string[],
  nightGenreList?: string[],
) {
  if (mode === 'focus') {
    if ((focusGenreList ?? []).length > 0) {
      return new Set((focusGenreList ?? []).map((value) => value.toLowerCase()))
    }
    return focusGenres
  }
  if (mode === 'night') {
    if ((nightGenreList ?? []).length > 0) {
      return new Set((nightGenreList ?? []).map((value) => value.toLowerCase()))
    }
    return nightGenres
  }
  return null
}

export function matchesSessionModeGenre(
  song: ISong,
  mode: SessionMode,
  focusGenreList?: string[],
  nightGenreList?: string[],
) {
  if (mode === 'off') return true

  const allowed = getSessionGenreSet(mode, focusGenreList, nightGenreList)
  if (!allowed) return true

  const genres = splitGenreCandidates(song.genre)
  if (genres.length === 0) return false

  return genres.some((genre) => allowed.has(genre))
}
