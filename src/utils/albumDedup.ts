import { Albums, SingleAlbum } from '@/types/responses/album'
import { ISong } from '@/types/responses/song'

const mergedAlbumGroupRegistry = new Map<string, string[]>()

function normalizeText(value?: string) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function albumKey(album: Albums) {
  const mbid = normalizeText(album.musicBrainzId)
  if (mbid) return `mbid:${mbid}`

  const name = normalizeText(album.name)
  const artistId = normalizeText(album.artistId)
  if (artistId) return `artist:${artistId}|album:${name}`

  const artist = normalizeText(album.artist ?? '')
  return `artist-name:${artist}|album:${name}`
}

function albumLooseKey(album: Albums) {
  const name = normalizeText(album.name)
  const coverArt = normalizeText(album.coverArt)
  const artist = normalizeText(album.artist ?? '')

  if (name && coverArt) return `name-cover:${name}|${coverArt}`
  if (name && artist) return `name-artist:${name}|${artist}`
  if (name) return `name:${name}`
  return `id:${album.id}`
}

function pickBetterAlbum(current: Albums, candidate: Albums) {
  if ((candidate.songCount ?? 0) > (current.songCount ?? 0)) return candidate
  if ((candidate.duration ?? 0) > (current.duration ?? 0)) return candidate
  if ((candidate.created ?? '') > (current.created ?? '')) return candidate
  return current
}

export function dedupeAlbumsByIdentity(albums: Albums[]) {
  const strictMap = new Map<string, Albums[]>()

  for (const album of albums) {
    const key = albumKey(album)
    const grouped = strictMap.get(key)
    if (!grouped) {
      strictMap.set(key, [album])
      continue
    }
    grouped.push(album)
  }

  const strictMerged: Albums[] = []

  for (const group of strictMap.values()) {
    const representative = group.reduce((best, current) =>
      pickBetterAlbum(best, current),
    )
    const groupedIds = [...new Set(group.map((album) => album.id))]
    const mergedSongCount = group.reduce(
      (total, album) => total + (album.songCount ?? 0),
      0,
    )
    const mergedDuration = group.reduce(
      (total, album) => total + (album.duration ?? 0),
      0,
    )

    mergedAlbumGroupRegistry.set(representative.id, groupedIds)
    strictMerged.push({
      ...representative,
      songCount: Math.max(representative.songCount ?? 0, mergedSongCount),
      duration: Math.max(representative.duration ?? 0, mergedDuration),
    })
  }

  // Second pass: collapse mirrored duplicates that still escaped strict keys
  // (commonly same release mirrored across folders with inconsistent artist ids).
  const looseMap = new Map<string, Albums[]>()
  for (const album of strictMerged) {
    const key = albumLooseKey(album)
    const grouped = looseMap.get(key)
    if (!grouped) {
      looseMap.set(key, [album])
      continue
    }
    grouped.push(album)
  }

  const finalMerged: Albums[] = []
  for (const group of looseMap.values()) {
    const representative = group.reduce((best, current) =>
      pickBetterAlbum(best, current),
    )
    const mergedSongCount = group.reduce(
      (total, album) => total + (album.songCount ?? 0),
      0,
    )
    const mergedDuration = group.reduce(
      (total, album) => total + (album.duration ?? 0),
      0,
    )

    const previousIds = new Set<string>()
    for (const album of group) {
      const registered = mergedAlbumGroupRegistry.get(album.id)
      if (registered && registered.length > 0) {
        registered.forEach((id) => previousIds.add(id))
      } else {
        previousIds.add(album.id)
      }
    }

    mergedAlbumGroupRegistry.set(representative.id, [...previousIds])
    finalMerged.push({
      ...representative,
      songCount: Math.max(representative.songCount ?? 0, mergedSongCount),
      duration: Math.max(representative.duration ?? 0, mergedDuration),
    })
  }

  return finalMerged
}

export function dedupeAlbumsForDisplay(albums: Albums[]) {
  const base = dedupeAlbumsByIdentity(albums)
  const map = new Map<string, Albums>()

  for (const album of base) {
    const key = albumLooseKey(album)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, album)
      continue
    }
    map.set(key, pickBetterAlbum(existing, album))
  }

  return [...map.values()]
}

function songTrackKey(song: ISong) {
  const disc = Number.isFinite(song.discNumber) ? String(song.discNumber) : ''
  const track = Number.isFinite(song.track) ? String(song.track) : ''
  const title = normalizeText(song.title)
  const duration = Number.isFinite(song.duration)
    ? String(Math.round(song.duration))
    : ''
  return `${disc}|${track}|${title}|${duration}`
}

function pickRandom<T>(items: T[]) {
  if (items.length <= 1) return items[0]
  const index = Math.floor(Math.random() * items.length)
  return items[index]
}

export function dedupeAlbumSongsRandomVariant(songs: ISong[]) {
  const groups = new Map<string, ISong[]>()

  for (const song of songs) {
    const key = songTrackKey(song)
    const list = groups.get(key)
    if (!list) {
      groups.set(key, [song])
      continue
    }
    list.push(song)
  }

  const deduped = [...groups.values()].map((group) => pickRandom(group))
  return deduped.sort((a, b) => {
    const discA = Number.isFinite(a.discNumber) ? a.discNumber : 0
    const discB = Number.isFinite(b.discNumber) ? b.discNumber : 0
    if (discA !== discB) return discA - discB

    const trackA = Number.isFinite(a.track) ? a.track : 0
    const trackB = Number.isFinite(b.track) ? b.track : 0
    if (trackA !== trackB) return trackA - trackB

    return a.title.localeCompare(b.title)
  })
}

export function dedupeSingleAlbumSongs(album?: SingleAlbum) {
  if (!album || !Array.isArray(album.song)) return album
  const dedupedSongs = dedupeAlbumSongsRandomVariant(album.song)
  if (dedupedSongs.length === album.song.length) return album

  return {
    ...album,
    song: dedupedSongs,
    songCount: dedupedSongs.length,
    duration: dedupedSongs.reduce(
      (total, song) => total + (song.duration ?? 0),
      0,
    ),
  }
}

export function getMergedAlbumIdsForRepresentative(representativeId: string) {
  return mergedAlbumGroupRegistry.get(representativeId) ?? [representativeId]
}

export function mergeSingleAlbums(albums: SingleAlbum[]) {
  if (albums.length === 0) return undefined
  if (albums.length === 1) return dedupeSingleAlbumSongs(albums[0])

  const representative = albums.reduce((best, current) => {
    const bestSongCount = best.song?.length ?? best.songCount ?? 0
    const currentSongCount = current.song?.length ?? current.songCount ?? 0
    if (currentSongCount > bestSongCount) return current
    if ((current.duration ?? 0) > (best.duration ?? 0)) return current
    return best
  })

  const allSongs = albums.flatMap((album) => album.song ?? [])
  const dedupedSongs = dedupeAlbumSongsRandomVariant(allSongs)

  return {
    ...representative,
    song: dedupedSongs,
    songCount: dedupedSongs.length,
    duration: dedupedSongs.reduce(
      (total, song) => total + (song.duration ?? 0),
      0,
    ),
  }
}
