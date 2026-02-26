import { subsonic } from './subsonic'
import type { Song } from '@/types/responses/song'
import { isGenreUsable, normalizeGenreName } from '@/utils/genreNormalization'
import {
  getListeningMemoryEnabledPreference,
  sortByListeningMemory,
} from '@/utils/listening-memory'

export type DayPart = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'midnight'

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

const DAYPART_MAX_PER_ARTIST = 2
const DAYPART_MAX_PER_ALBUM = 2

const DAYPART_GENRES: Record<DayPart, string[]> = {
  morning: [
    'Acoustic',
    'A Cappella',
    'Singer-Songwriter',
    'Folk',
    'Folk, Singer & Songwriter',
    'Neo Soul',
    'New Age',
    'Ambient Pop',
    'Trip Hop',
    'Adult Contemporary',
    'Contemporary Rnb',
    'R&B',
  ],
  noon: [
    'Pop',
    'Alt-Pop',
    'Electropop',
    'Dance',
    'Electronic',
    'Indietronica',
    'Synthpop',
    'K-Pop',
    'J-Pop',
    'Hip-Hop',
    'Rap',
    'West Coast Hip Hop',
  ],
  afternoon: [
    'Alternative',
    'Alternative Rock',
    'Alt. Rock',
    'Indie Rock',
    'Rock',
    'Pop Rock',
    'Punk Rock',
    'Emo',
    'Post-Hardcore',
    'Metalcore',
    'Nu Metal',
    'Trap',
  ],
  evening: [
    'Synthwave',
    'Art Pop',
    'Art Rock',
    'Shoegaze',
    'Progressive Rock',
    'R&B',
    'Alternative Rnb',
    'Neo Soul',
    'Film Score',
    'Soundtrack',
    'Electro House',
    'Dance Punk',
  ],
  night: [
    'Film Score',
    'Soundtrack',
    'Dark Ambient',
    'New Age',
    'Trip Hop',
    'Ambient Pop',
    'Synthwave',
    'Art Rock',
    'Progressive Rock',
    'Electronic',
    'Indietronica',
    'Experimental',
  ],
  midnight: [
    'Dark Ambient',
    'Industrial',
    'Industrial Metal',
    'Black Metal',
    'Death Metal',
    'Doom Metal',
    'Sludge Metal',
    'Thrash Metal',
    'Djent',
    'Experimental',
    'Experimental Hip Hop',
    'Grime',
  ],
}

const SLOT_STARTS = {
  midnight: { hour: 0, minute: 0 },
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
  const midnightStart = SLOT_STARTS.midnight.hour * 60 + SLOT_STARTS.midnight.minute
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
  } else if (minutes >= midnightStart) {
    dayPart = 'midnight'
    windowStart = setTime(date, SLOT_STARTS.midnight.hour, SLOT_STARTS.midnight.minute)
  } else {
    dayPart = 'midnight'
    windowStart = setTime(date, SLOT_STARTS.midnight.hour, SLOT_STARTS.midnight.minute)
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
    setTime(date, 24, 0),
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

function getTokenSet(value: string) {
  return new Set(
    normalize(value)
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  )
}

function resolveMatchingGenres(preferredGenres: string[], libraryGenres: string[]) {
  const normalizedLibrary = libraryGenres
    .filter(isGenreUsable)
    .map((genre) => ({
      original: genre,
      normalized: normalize(genre),
      canonical: normalize(normalizeGenreName(genre)),
    }))

  const scores = new Map<string, number>()

  for (const preferred of preferredGenres) {
    const normalizedPreferred = normalize(preferred)
    const canonicalPreferred = normalize(normalizeGenreName(preferred))
    const preferredTokens = getTokenSet(preferred)

    for (const candidate of normalizedLibrary) {
      let score = 0

      if (
        candidate.normalized === normalizedPreferred ||
        candidate.canonical === canonicalPreferred
      ) {
        score = 4
      } else if (
        candidate.normalized.includes(normalizedPreferred) ||
        normalizedPreferred.includes(candidate.normalized) ||
        candidate.canonical.includes(canonicalPreferred) ||
        canonicalPreferred.includes(candidate.canonical)
      ) {
        score = 3
      } else {
        const candidateTokens = getTokenSet(candidate.original)
        const overlap = [...preferredTokens].filter((token) =>
          candidateTokens.has(token),
        ).length
        if (overlap >= 2) score = 2
        else if (overlap === 1) score = 1
      }

      if (score > 0) {
        const prev = scores.get(candidate.original) ?? 0
        scores.set(candidate.original, Math.max(prev, score))
      }
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([genre]) => genre)
}

function getArtistKey(song: Song) {
  return song.artistId ?? song.artist?.trim().toLowerCase() ?? `artist:${song.id}`
}

function getAlbumKey(song: Song) {
  return song.albumId ?? song.album?.trim().toLowerCase() ?? `album:${song.id}`
}

function buildBalancedPlaylist(candidates: Song[], size: number): Song[] {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  const artistCounts = new Map<string, number>()
  const albumCounts = new Map<string, number>()
  const selected: Song[] = []
  const usedIds = new Set<string>()
  const uniqueArtistCount = new Set(shuffled.map(getArtistKey)).size
  const uniqueAlbumCount = new Set(shuffled.map(getAlbumKey)).size
  const artistCapTarget = Math.max(
    DAYPART_MAX_PER_ARTIST,
    Math.ceil(size / Math.max(1, uniqueArtistCount)),
  )
  const albumCapTarget = Math.max(
    DAYPART_MAX_PER_ALBUM,
    Math.ceil(size / Math.max(1, uniqueAlbumCount)),
  )

  const tryTake = (song: Song, artistCap: number, albumCap: number) => {
    if (usedIds.has(song.id)) return false

    const artistKey = getArtistKey(song)
    const albumKey = getAlbumKey(song)
    const artistCount = artistCounts.get(artistKey) ?? 0
    const albumCount = albumCounts.get(albumKey) ?? 0

    if (artistCount >= artistCap || albumCount >= albumCap) {
      return false
    }

    selected.push(song)
    usedIds.add(song.id)
    artistCounts.set(artistKey, artistCount + 1)
    albumCounts.set(albumKey, albumCount + 1)
    return true
  }

  // Gradually relax caps instead of dropping them completely.
  const artistCaps = new Set<number>([
    DAYPART_MAX_PER_ARTIST,
    Math.min(DAYPART_MAX_PER_ARTIST + 1, artistCapTarget),
    artistCapTarget,
  ])
  const albumCaps = new Set<number>([
    DAYPART_MAX_PER_ALBUM,
    Math.min(DAYPART_MAX_PER_ALBUM + 1, albumCapTarget),
    albumCapTarget,
  ])
  const capStages = [...artistCaps].map((artistCap) => ({
    artistCap,
    albumCap: [...albumCaps].find((v) => v >= artistCap) ?? albumCapTarget,
  }))

  for (const stage of capStages) {
    for (const song of shuffled) {
      if (selected.length >= size) break
      tryTake(song, stage.artistCap, stage.albumCap)
    }
    if (selected.length >= size) break
  }

  return selected.slice(0, size)
}

export async function generateTimeOfDayPlaylist(
  size: number = 50,
): Promise<TimeOfDayGenerationResult> {
  const { dayPart, windowKey } = getCurrentDayPart()
  const preferredGenres = DAYPART_GENRES[dayPart]
  const availableGenres = (await subsonic.genres.get()) ?? []
  const availableGenreNames = availableGenres
    .map((genre) => genre.value)
    .filter(isGenreUsable)
  const matchingGenres = resolveMatchingGenres(preferredGenres, availableGenreNames)

  const genreQueue = matchingGenres.length > 0 ? matchingGenres : preferredGenres.slice(0, 6)
  const songsById = new Map<string, Song>()
  const genresUsed = new Set<string>()

  // Round-robin fetch to avoid overfilling from the first one or two genres.
  const rounds = 3
  const batchSizePerRound = 8
  for (let round = 0; round < rounds; round++) {
    for (const genre of genreQueue) {
      if (songsById.size >= size * 3) break

      const randomSongs =
        (await subsonic.songs.getRandomSongs({ size: batchSizePerRound, genre })) ??
        []
      randomSongs.forEach((song) => {
        if (!songsById.has(song.id)) {
          songsById.set(song.id, song)
          genresUsed.add(genre)
        }
      })
    }
  }

  if (songsById.size < size) {
    const fallbackSongs = (await subsonic.songs.getRandomSongs({ size: Math.max(50, size * 2) })) ?? []
    fallbackSongs.forEach((song) => {
      if (!songsById.has(song.id)) {
        songsById.set(song.id, song)
      }
    })
  }

  const listeningMemoryEnabled = getListeningMemoryEnabledPreference()
  const candidates = sortByListeningMemory(
    Array.from(songsById.values()),
    listeningMemoryEnabled,
  )
  const playlist = buildBalancedPlaylist(candidates, size)

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
