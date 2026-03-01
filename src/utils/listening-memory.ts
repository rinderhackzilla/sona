import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'

type MemorySong = {
  id: string
  artistId?: string
  artist?: string
  albumId?: string
  album?: string
}

type MemoryEntry = {
  songId: string
  artistKey: string
  albumKey: string
  playedAt: number
}

const MEMORY_STORAGE_KEY = 'sona.listeningMemory.entries.v1'
const MEMORY_ENABLED_KEY = 'sona.listeningMemory.enabled'
const MAX_ENTRIES = 800

function normalize(value?: string) {
  return (value ?? '').trim().toLowerCase()
}

function getArtistKey(song: MemorySong) {
  return song.artistId ?? normalize(song.artist) ?? `artist:${song.id}`
}

function getAlbumKey(song: MemorySong) {
  return song.albumId ?? normalize(song.album) ?? `album:${song.id}`
}

function loadEntries(): MemoryEntry[] {
  try {
    const raw = safeStorageGet(MEMORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MemoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        Boolean(item?.songId) &&
        Boolean(item?.artistKey) &&
        Boolean(item?.albumKey) &&
        typeof item?.playedAt === 'number',
    )
  } catch {
    return []
  }
}

function saveEntries(entries: MemoryEntry[]) {
  try {
    safeStorageSet(
      MEMORY_STORAGE_KEY,
      JSON.stringify(entries.slice(-MAX_ENTRIES)),
    )
  } catch {
    // Keep runtime resilient on storage failures.
  }
}

export function getListeningMemoryEnabledPreference() {
  const value = safeStorageGet(MEMORY_ENABLED_KEY)
  if (value == null) return true
  return value === '1'
}

export function setListeningMemoryEnabledPreference(enabled: boolean) {
  safeStorageSet(MEMORY_ENABLED_KEY, enabled ? '1' : '0')
}

export function rememberSongPlayback(song: MemorySong | null | undefined) {
  if (!song?.id) return
  const now = Date.now()
  const entry: MemoryEntry = {
    songId: song.id,
    artistKey: getArtistKey(song),
    albumKey: getAlbumKey(song),
    playedAt: now,
  }

  const entries = loadEntries()
  const last = entries[entries.length - 1]
  if (last && last.songId === entry.songId && now - last.playedAt < 45_000) return

  entries.push(entry)
  saveEntries(entries)
}

function scoreCandidate(song: MemorySong, entries: MemoryEntry[], now: number) {
  const artistKey = getArtistKey(song)
  const albumKey = getAlbumKey(song)
  let score = 0

  for (const entry of entries) {
    const ageMs = now - entry.playedAt
    if (ageMs > 14 * 24 * 60 * 60 * 1000) continue

    if (entry.songId === song.id) {
      if (ageMs < 72 * 60 * 60 * 1000) score += 320
      else if (ageMs < 7 * 24 * 60 * 60 * 1000) score += 180
      else score += 80
    }

    if (entry.artistKey === artistKey) {
      if (ageMs < 12 * 60 * 60 * 1000) score += 120
      else if (ageMs < 3 * 24 * 60 * 60 * 1000) score += 70
      else if (ageMs < 7 * 24 * 60 * 60 * 1000) score += 35
    }

    if (entry.albumKey === albumKey) {
      if (ageMs < 24 * 60 * 60 * 1000) score += 90
      else if (ageMs < 4 * 24 * 60 * 60 * 1000) score += 45
      else if (ageMs < 10 * 24 * 60 * 60 * 1000) score += 20
    }
  }

  return score
}

export function sortByListeningMemory<T extends MemorySong>(
  candidates: T[],
  enabled: boolean,
): T[] {
  if (!enabled || candidates.length <= 1) return candidates
  const entries = loadEntries()
  if (entries.length === 0) return candidates
  const now = Date.now()

  return [...candidates]
    .map((song) => ({
      song,
      score: scoreCandidate(song, entries, now) + Math.random() * 1.75,
    }))
    .sort((a, b) => a.score - b.score)
    .map((item) => item.song)
}

export function pickByListeningMemory<T extends MemorySong>(
  candidates: T[],
  enabled: boolean,
): T | undefined {
  return sortByListeningMemory(candidates, enabled)[0]
}
