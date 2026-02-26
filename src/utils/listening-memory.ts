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
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(MEMORY_STORAGE_KEY)
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
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      MEMORY_STORAGE_KEY,
      JSON.stringify(entries.slice(-MAX_ENTRIES)),
    )
  } catch {
    // Keep runtime resilient on storage failures.
  }
}

export function getListeningMemoryEnabledPreference() {
  if (typeof window === 'undefined') return true
  const value = window.localStorage.getItem(MEMORY_ENABLED_KEY)
  if (value == null) return true
  return value === '1'
}

export function setListeningMemoryEnabledPreference(enabled: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MEMORY_ENABLED_KEY, enabled ? '1' : '0')
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
    if (ageMs > 96 * 60 * 60 * 1000) continue

    if (entry.songId === song.id && ageMs < 72 * 60 * 60 * 1000) {
      score += 120
    }

    if (entry.artistKey === artistKey && ageMs < 10 * 60 * 60 * 1000) {
      score += 35
    }

    if (entry.albumKey === albumKey && ageMs < 16 * 60 * 60 * 1000) {
      score += 25
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

