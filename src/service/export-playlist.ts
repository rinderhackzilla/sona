import type { Song } from '@/types/responses/song'
import { logger } from '@/utils/logger'
import { playlists } from './playlists'

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

  logger.info(
    `[ExportPlaylist] Exported "${name}" with ${songIds.length} songs`,
  )
}
