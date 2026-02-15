import { playlists } from './playlists'
import type { Song } from '@/types/responses/song'

interface ExportPlaylistParams {
  name: string
  songs: Song[]
  comment?: string
  isPublic?: boolean
}

/**
 * Export a generated playlist to Navidrome as a new playlist
 */
export async function exportPlaylist({
  name,
  songs,
  comment = '',
  isPublic = false,
}: ExportPlaylistParams): Promise<void> {
  if (songs.length === 0) {
    throw new Error('Cannot export empty playlist')
  }

  const songIds = songs.map((song) => song.id)

  await playlists.createWithDetails({
    name,
    comment,
    isPublic: isPublic ? 'true' : 'false',
    songIdToAdd: songIds,
  })

  console.log(`[ExportPlaylist] ✓ Exported "${name}" with ${songIds.length} songs`)
}
