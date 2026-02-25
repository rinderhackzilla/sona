import { subsonic } from './subsonic'
import type { Song } from '@/types/responses/song'

export type DayPart = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night'

export interface TimeOfDayPlaylistMetadata {
  generatedAt: string
  dayPart: DayPart
  windowKey: string
  genresUsed: string[]
  totalSongs: number
}

export interface TimeOfDayGenerationResult {
  playlist: Song[]
  metadata: TimeOfDayPlaylistMetadata
}

const DAYPART_GENRES: Record<DayPart, string[]> = {
  morning: ['Acoustic', 'Folk', 'Ambient', 'Lo-Fi', 'Singer-Songwriter', 'Indie'],
  noon: ['Pop', 'Funk', 'Soul', 'Disco', 'Dance', 'Indie Pop'],
  afternoon: ['Alternative', 'Rock', 'Indie Rock', 'Hip-Hop', 'Electronic', 'Synthpop'],
  evening: ['R&B', 'Neo Soul', 'Jazz', 'Downtempo', 'Chillout', 'Trip-Hop'],
  night: ['Ambient', 'Electronica', 'Trip-Hop', 'Classical', 'Lo-Fi', 'Downtempo'],
}

const SLOT_STARTS = {
  morning: { hour: 6, minute: 0 },
  noon: { hour: 11, minute: 30 },
  afternoon: { hour: 15, minute: 0 },
  evening: { hour: 18, minute: 0 },
  night: { hour: 21, minute: 0 },
} as const

function setTime(target: Date, hour: number, minute: number) {
  const next = new Date(target)
  next.setHours(hour, minute, 0, 0)
  return next
}

function formatWindowKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function getCurrentDayPart(date: Date = new Date()): {
  dayPart: DayPart
  windowStart: Date
  windowKey: string
} {
  const minutes = date.getHours() * 60 + date.getMinutes()
  const morningStart = SLOT_STARTS.morning.hour * 60 + SLOT_STARTS.morning.minute
  const noonStart = SLOT_STARTS.noon.hour * 60 + SLOT_STARTS.noon.minute
  const afternoonStart = SLOT_STARTS.afternoon.hour * 60 + SLOT_STARTS.afternoon.minute
  const eveningStart = SLOT_STARTS.evening.hour * 60 + SLOT_STARTS.evening.minute
  const nightStart = SLOT_STARTS.night.hour * 60 + SLOT_STARTS.night.minute

  let dayPart: DayPart
  let windowStart: Date

  if (minutes >= nightStart) {
    dayPart = 'night'
    windowStart = setTime(date, SLOT_STARTS.night.hour, SLOT_STARTS.night.minute)
  } else if (minutes >= eveningStart) {
    dayPart = 'evening'
    windowStart = setTime(date, SLOT_STARTS.evening.hour, SLOT_STARTS.evening.minute)
  } else if (minutes >= afternoonStart) {
    dayPart = 'afternoon'
    windowStart = setTime(date, SLOT_STARTS.afternoon.hour, SLOT_STARTS.afternoon.minute)
  } else if (minutes >= noonStart) {
    dayPart = 'noon'
    windowStart = setTime(date, SLOT_STARTS.noon.hour, SLOT_STARTS.noon.minute)
  } else if (minutes >= morningStart) {
    dayPart = 'morning'
    windowStart = setTime(date, SLOT_STARTS.morning.hour, SLOT_STARTS.morning.minute)
  } else {
    dayPart = 'night'
    const yesterday = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    windowStart = setTime(yesterday, SLOT_STARTS.night.hour, SLOT_STARTS.night.minute)
  }

  return {
    dayPart,
    windowStart,
    windowKey: formatWindowKey(windowStart),
  }
}

export function getMillisecondsUntilNextDayPartBoundary(date: Date = new Date()) {
  const boundaries = [
    setTime(date, SLOT_STARTS.morning.hour, SLOT_STARTS.morning.minute),
    setTime(date, SLOT_STARTS.noon.hour, SLOT_STARTS.noon.minute),
    setTime(date, SLOT_STARTS.afternoon.hour, SLOT_STARTS.afternoon.minute),
    setTime(date, SLOT_STARTS.evening.hour, SLOT_STARTS.evening.minute),
    setTime(date, SLOT_STARTS.night.hour, SLOT_STARTS.night.minute),
  ]

  const nextToday = boundaries.find((boundary) => boundary.getTime() > date.getTime())
  if (nextToday) {
    return nextToday.getTime() - date.getTime()
  }

  const tomorrow = new Date(date)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextMorning = setTime(tomorrow, SLOT_STARTS.morning.hour, SLOT_STARTS.morning.minute)
  return nextMorning.getTime() - date.getTime()
}

function normalize(value: string) {
  return value.toLowerCase().trim()
}

function resolveMatchingGenres(preferredGenres: string[], libraryGenres: string[]) {
  const normalizedLibrary = libraryGenres.map((genre) => ({
    original: genre,
    normalized: normalize(genre),
  }))

  const result: string[] = []
  const seen = new Set<string>()

  preferredGenres.forEach((preferred) => {
    const normalizedPreferred = normalize(preferred)

    const exactMatch = normalizedLibrary.find((genre) => genre.normalized === normalizedPreferred)
    const partialMatch =
      exactMatch ??
      normalizedLibrary.find(
        (genre) =>
          genre.normalized.includes(normalizedPreferred) ||
          normalizedPreferred.includes(genre.normalized),
      )

    if (partialMatch && !seen.has(partialMatch.original)) {
      seen.add(partialMatch.original)
      result.push(partialMatch.original)
    }
  })

  return result
}

export async function generateTimeOfDayPlaylist(
  size: number = 50,
): Promise<TimeOfDayGenerationResult> {
  const { dayPart, windowKey } = getCurrentDayPart()
  const preferredGenres = DAYPART_GENRES[dayPart]
  const availableGenres = (await subsonic.genres.get()) ?? []
  const availableGenreNames = availableGenres.map((genre) => genre.value)
  const matchingGenres = resolveMatchingGenres(preferredGenres, availableGenreNames)

  const genreQueue = matchingGenres.length > 0 ? matchingGenres : preferredGenres.slice(0, 4)
  const songsById = new Map<string, Song>()
  const genresUsed = new Set<string>()

  for (const genre of genreQueue) {
    if (songsById.size >= size) break

    const randomSongs = (await subsonic.songs.getRandomSongs({ size: 22, genre })) ?? []
    randomSongs.forEach((song) => {
      if (!songsById.has(song.id)) {
        songsById.set(song.id, song)
        genresUsed.add(genre)
      }
    })
  }

  if (songsById.size < size) {
    const fallbackSongs = (await subsonic.songs.getRandomSongs({ size: Math.max(50, size * 2) })) ?? []
    fallbackSongs.forEach((song) => {
      if (!songsById.has(song.id)) {
        songsById.set(song.id, song)
      }
    })
  }

  const playlist = Array.from(songsById.values())
    .sort(() => Math.random() - 0.5)
    .slice(0, size)

  return {
    playlist,
    metadata: {
      generatedAt: new Date().toISOString(),
      dayPart,
      windowKey,
      genresUsed: Array.from(genresUsed),
      totalSongs: playlist.length,
    },
  }
}

