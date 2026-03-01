import type { Song } from '@/types/responses/song'
import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'

export function readStoredString(key: string): string | null {
  return safeStorageGet(key)
}

export function writeStoredString(key: string, value: string): void {
  safeStorageSet(key, value)
}

export function readStoredJson<T>(key: string): T | null {
  const raw = safeStorageGet(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeStoredJson<T>(key: string, value: T): void {
  try {
    safeStorageSet(key, JSON.stringify(value))
  } catch {
    // no-op
  }
}

export function readStoredPlaylist<TMetadata>(
  playlistKey: string,
  metadataKey: string,
): { playlist: Song[]; metadata: TMetadata | null } {
  const playlist = readStoredJson<Song[]>(playlistKey)
  const metadata = readStoredJson<TMetadata>(metadataKey)

  if (!playlist || !metadata) {
    return { playlist: [], metadata: null }
  }

  return { playlist, metadata }
}

export function writeStoredPlaylist<TMetadata>(
  playlistKey: string,
  metadataKey: string,
  playlist: Song[],
  metadata: TMetadata,
): void {
  writeStoredJson(playlistKey, playlist)
  writeStoredJson(metadataKey, metadata)
}
