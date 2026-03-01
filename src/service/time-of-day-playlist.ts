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

type DaypartBucket = {
  label: string
  targetShare: number
  genres: string[]
}

type DaypartConfig = {
  minUniqueGenres: number
  maxPerArtist: number
  maxPerAlbum: number
  buckets: DaypartBucket[]
}

const DAYPART_CONFIG: Record<DayPart, DaypartConfig> = {
  morning: {
    minUniqueGenres: 5,
    maxPerArtist: 2,
    maxPerAlbum: 1,
    buckets: [
      {
        label: 'soft-acoustic',
        targetShare: 0.45,
        genres: [
          'Acoustic',
          'A Cappella',
          'Singer-Songwriter',
          'Folk',
          'Folk, Singer & Songwriter',
          'Adult Contemporary',
        ],
      },
      {
        label: 'warm-rnb',
        targetShare: 0.35,
        genres: ['Neo Soul', 'R&B', 'Contemporary Rnb', 'Trip Hop', 'Ambient Pop'],
      },
      {
        label: 'light-electronic',
        targetShare: 0.2,
        genres: ['New Age', 'Electronic', 'Synthpop'],
      },
    ],
  },
  noon: {
    minUniqueGenres: 6,
    maxPerArtist: 2,
    maxPerAlbum: 1,
    buckets: [
      {
        label: 'spoken-forward',
        targetShare: 0.5,
        genres: [
          'Hip-Hop',
          'Rap',
          'Rap & Hip-Hop',
          'Rap/Hip Hop',
          'West Coast Hip Hop',
          'Trap',
          'Grime',
          'Political Hip Hop',
        ],
      },
      {
        label: 'pop-melodic',
        targetShare: 0.3,
        genres: ['Pop', 'Alt-Pop', 'Electropop', 'K-Pop', 'J-Pop', 'R&B'],
      },
      {
        label: 'dance-drive',
        targetShare: 0.2,
        genres: ['Dance', 'Electronic', 'Electro House', 'Synthpop', 'Indietronica'],
      },
    ],
  },
  afternoon: {
    minUniqueGenres: 6,
    maxPerArtist: 2,
    maxPerAlbum: 1,
    buckets: [
      {
        label: 'guitar-pop-punk',
        targetShare: 0.45,
        genres: [
          'Pop Punk',
          'Punk Rock',
          'Alternative Rock',
          'Alt. Rock',
          'Rock',
          'Pop Rock',
          'Emo',
        ],
      },
      {
        label: 'spoken-hybrid',
        targetShare: 0.25,
        genres: ['Hip-Hop', 'Rap', 'Rapcore', 'Nu Metal', 'Trap'],
      },
      {
        label: 'electro-alt',
        targetShare: 0.3,
        genres: ['Electronic', 'Dance Punk', 'Indietronica', 'Synthwave', 'Alternative'],
      },
    ],
  },
  evening: {
    minUniqueGenres: 6,
    maxPerArtist: 2,
    maxPerAlbum: 1,
    buckets: [
      {
        label: 'electronic-main',
        targetShare: 0.55,
        genres: [
          'Electronic',
          'Electro House',
          'Synthwave',
          'Synthpop',
          'Dance',
          'Indietronica',
          'Trip Hop',
        ],
      },
      {
        label: 'smooth-rnb',
        targetShare: 0.3,
        genres: ['R&B', 'Neo Soul', 'Alternative Rnb', 'Contemporary Rnb'],
      },
      {
        label: 'cinematic',
        targetShare: 0.15,
        genres: ['Film Score', 'Soundtrack'],
      },
    ],
  },
  night: {
    minUniqueGenres: 5,
    maxPerArtist: 2,
    maxPerAlbum: 1,
    buckets: [
      {
        label: 'metalcore-late',
        targetShare: 0.45,
        genres: [
          'Metalcore',
          'Post-Hardcore',
          'Metalcore / Post-Hardcore / Deathcore',
          'Progressive Metalcore',
          'Nu Metal',
        ],
      },
      {
        label: 'dark-electronic',
        targetShare: 0.35,
        genres: ['Industrial', 'Industrial Metal', 'Dark Ambient', 'Electronic', 'Grime'],
      },
      {
        label: 'spoken-night',
        targetShare: 0.2,
        genres: ['Hip-Hop', 'Rap', 'Trap', 'Southern Rap'],
      },
    ],
  },
  midnight: {
    minUniqueGenres: 4,
    maxPerArtist: 2,
    maxPerAlbum: 1,
    buckets: [
      {
        label: 'extreme-metal',
        targetShare: 0.55,
        genres: [
          'Black Metal',
          'Death Metal',
          'Brutal Death Metal',
          'Melodic Death Metal',
          'Doom Metal',
          'Thrash Metal',
          'Sludge Metal',
          'Djent',
          'Deathcore',
        ],
      },
      {
        label: 'dark-atmosphere',
        targetShare: 0.3,
        genres: ['Dark Ambient', 'Industrial', 'Industrial Metal', 'Experimental'],
      },
      {
        label: 'heavy-spoken',
        targetShare: 0.15,
        genres: ['Experimental Hip Hop', 'Rapcore', 'Trap', 'Grime'],
      },
    ],
  },
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
  if (nextToday) return nextToday.getTime() - date.getTime()

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

function dedupeSongs(songs: Song[]) {
  const map = new Map<string, Song>()
  songs.forEach((song) => {
    if (!map.has(song.id)) map.set(song.id, song)
  })
  return [...map.values()]
}

function getArtistKey(song: Song) {
  return song.artistId ?? song.artist?.trim().toLowerCase() ?? `artist:${song.id}`
}

function getAlbumKey(song: Song) {
  return song.albumId ?? song.album?.trim().toLowerCase() ?? `album:${song.id}`
}

function planBucketSizes(size: number, buckets: DaypartBucket[]) {
  const planned = buckets.map((bucket) => ({
    label: bucket.label,
    count: Math.floor(size * bucket.targetShare),
  }))

  let assigned = planned.reduce((sum, item) => sum + item.count, 0)
  let cursor = 0
  while (assigned < size) {
    planned[cursor % planned.length].count += 1
    cursor += 1
    assigned += 1
  }

  return planned
}

function buildWeightedGenreOrder(genres: string[], targetCountByGenre: Map<string, number>) {
  const order: string[] = []
  genres.forEach((genre) => {
    const count = Math.max(1, targetCountByGenre.get(genre) ?? 1)
    for (let i = 0; i < count; i++) {
      order.push(genre)
    }
  })
  return order.sort(() => Math.random() - 0.5)
}

function pickWithConstraints(
  queuesByGenre: Map<string, Song[]>,
  weightedOrder: string[],
  size: number,
  maxPerArtist: number,
  maxPerAlbum: number,
  minUniqueGenres: number,
) {
  const selected: Song[] = []
  const selectedIds = new Set<string>()
  const artistCounts = new Map<string, number>()
  const albumCounts = new Map<string, number>()
  const genreCounts = new Map<string, number>()

  const uniqueGenresTarget = Math.min(minUniqueGenres, queuesByGenre.size)
  const genreCapSoft = Math.max(1, Math.ceil(size / Math.max(1, uniqueGenresTarget)))

  const takeSong = (genre: string, song: Song, allowGenreOverflow: boolean) => {
    if (selectedIds.has(song.id)) return false

    const artistKey = getArtistKey(song)
    const albumKey = getAlbumKey(song)
    const artistCount = artistCounts.get(artistKey) ?? 0
    const albumCount = albumCounts.get(albumKey) ?? 0
    const currentGenreCount = genreCounts.get(genre) ?? 0

    if (artistCount >= maxPerArtist) return false
    if (albumCount >= maxPerAlbum) return false
    if (!allowGenreOverflow && currentGenreCount >= genreCapSoft) return false

    selected.push(song)
    selectedIds.add(song.id)
    artistCounts.set(artistKey, artistCount + 1)
    albumCounts.set(albumKey, albumCount + 1)
    genreCounts.set(genre, currentGenreCount + 1)
    return true
  }

  const runPass = (allowGenreOverflow: boolean, allowAlbumRelax: boolean) => {
    for (const genre of weightedOrder) {
      if (selected.length >= size) break
      const queue = queuesByGenre.get(genre)
      if (!queue || queue.length === 0) continue

      while (queue.length > 0) {
        const candidate = queue.shift()
        if (!candidate) break
        const effectiveAlbumCap = allowAlbumRelax ? maxPerAlbum + 1 : maxPerAlbum
        const ok = takeSong(genre, candidate, allowGenreOverflow)
        if (ok) break

        if (allowAlbumRelax) {
          const artistKey = getArtistKey(candidate)
          const albumKey = getAlbumKey(candidate)
          const artistCount = artistCounts.get(artistKey) ?? 0
          const albumCount = albumCounts.get(albumKey) ?? 0
          const currentGenreCount = genreCounts.get(genre) ?? 0
          if (
            !selectedIds.has(candidate.id) &&
            artistCount < maxPerArtist &&
            albumCount < effectiveAlbumCap &&
            (allowGenreOverflow || currentGenreCount < genreCapSoft)
          ) {
            selected.push(candidate)
            selectedIds.add(candidate.id)
            artistCounts.set(artistKey, artistCount + 1)
            albumCounts.set(albumKey, albumCount + 1)
            genreCounts.set(genre, currentGenreCount + 1)
            break
          }
        }
      }
    }
  }

  runPass(false, false)
  if (selected.length < size) runPass(true, false)
  if (selected.length < size) runPass(true, true)

  return selected.slice(0, size)
}

export async function generateTimeOfDayPlaylist(
  size: number = 50,
): Promise<TimeOfDayGenerationResult> {
  const { dayPart, windowKey } = getCurrentDayPart()
  const config = DAYPART_CONFIG[dayPart]
  const availableGenres = (await subsonic.genres.get()) ?? []
  const availableGenreNames = availableGenres
    .map((genre) => genre.value)
    .filter(isGenreUsable)

  const bucketGenreMatches = new Map<string, string[]>()
  for (const bucket of config.buckets) {
    const matches = resolveMatchingGenres(bucket.genres, availableGenreNames)
    bucketGenreMatches.set(bucket.label, matches.slice(0, 8))
  }

  const bucketPlan = planBucketSizes(size, config.buckets)
  const targetCountByGenre = new Map<string, number>()
  const songsByGenre = new Map<string, Song[]>()

  for (const planned of bucketPlan) {
    const bucketMatches = bucketGenreMatches.get(planned.label) ?? []
    const selectedGenres = bucketMatches.length > 0 ? bucketMatches : []
    if (selectedGenres.length === 0) continue

    const perGenreTarget = Math.max(1, Math.floor(planned.count / selectedGenres.length))
    let remainder = planned.count - perGenreTarget * selectedGenres.length

    selectedGenres.forEach((genre) => {
      const target = perGenreTarget + (remainder > 0 ? 1 : 0)
      if (remainder > 0) remainder -= 1
      targetCountByGenre.set(genre, (targetCountByGenre.get(genre) ?? 0) + target)
    })
  }

  const fetchGenres = [...targetCountByGenre.keys()]
  for (const genre of fetchGenres) {
    const baseTarget = targetCountByGenre.get(genre) ?? 1
    const fetchSize = Math.max(10, Math.min(40, baseTarget * 4))
    const fetched = (await subsonic.songs.getRandomSongs({ size: fetchSize, genre })) ?? []
    songsByGenre.set(genre, dedupeSongs(fetched))
  }

  const listeningMemoryEnabled = getListeningMemoryEnabledPreference()
  const queuesByGenre = new Map<string, Song[]>()
  const genresUsed = new Set<string>()

  for (const [genre, songs] of songsByGenre.entries()) {
    const sorted = sortByListeningMemory(songs, listeningMemoryEnabled)
    if (sorted.length > 0) {
      queuesByGenre.set(genre, sorted)
      genresUsed.add(genre)
    }
  }

  const weightedOrder = buildWeightedGenreOrder(
    [...queuesByGenre.keys()],
    targetCountByGenre,
  )
  const playlist = pickWithConstraints(
    queuesByGenre,
    weightedOrder,
    size,
    config.maxPerArtist,
    config.maxPerAlbum,
    config.minUniqueGenres,
  )

  if (playlist.length < size) {
    const fallbackSongs =
      (await subsonic.songs.getRandomSongs({ size: Math.max(60, size * 3) })) ?? []
    const fallbackSorted = sortByListeningMemory(
      dedupeSongs(fallbackSongs),
      listeningMemoryEnabled,
    )

    const existingIds = new Set(playlist.map((song) => song.id))
    const artistCounts = new Map<string, number>()
    const albumCounts = new Map<string, number>()
    playlist.forEach((song) => {
      const artistKey = getArtistKey(song)
      const albumKey = getAlbumKey(song)
      artistCounts.set(artistKey, (artistCounts.get(artistKey) ?? 0) + 1)
      albumCounts.set(albumKey, (albumCounts.get(albumKey) ?? 0) + 1)
    })

    for (const song of fallbackSorted) {
      if (playlist.length >= size) break
      if (existingIds.has(song.id)) continue

      const artistKey = getArtistKey(song)
      const albumKey = getAlbumKey(song)
      if ((artistCounts.get(artistKey) ?? 0) >= config.maxPerArtist) continue
      if ((albumCounts.get(albumKey) ?? 0) >= config.maxPerAlbum + 1) continue

      playlist.push(song)
      existingIds.add(song.id)
      artistCounts.set(artistKey, (artistCounts.get(artistKey) ?? 0) + 1)
      albumCounts.set(albumKey, (albumCounts.get(albumKey) ?? 0) + 1)
    }
  }

  const actualGenresUsed = [
    ...new Set(
      playlist
        .map((song) => song.genre?.trim())
        .filter((genre): genre is string => Boolean(genre && genre.length > 0)),
    ),
  ]
  const genresUsedForMetadata =
    actualGenresUsed.length > 0 ? actualGenresUsed : [...genresUsed]

  return {
    playlist,
    metadata: {
      generatedAt: new Date().toISOString(),
      dayPart,
      windowKey,
      genresUsed: genresUsedForMetadata.slice(0, 8),
      totalSongs: playlist.length,
    },
  }
}
