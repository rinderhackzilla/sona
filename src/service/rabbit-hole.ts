import { lastfm } from './lastfm'
import { subsonic } from './subsonic'
import type { ISong } from '@/types/responses/song'

interface RabbitHoleOptions {
  artistName?: string
  albumName?: string
  albumId?: string
  artistId?: string
  lastfmApiKey: string
}

/**
 * Rabbit Hole: Create a 50-song queue with:
 * - Similar artists
 * - Similar tracks
 * - More from the same artist
 */
export class RabbitHoleService {
  private lastfmApiKey: string

  constructor(lastfmApiKey: string) {
    this.lastfmApiKey = lastfmApiKey
  }

  /**
   * Generate Rabbit Hole queue for an artist
   */
  async generateForArtist(
    artistName: string,
    artistId?: string,
  ): Promise<ISong[]> {
    const songs: ISong[] = []

    try {
      // 1. Get similar artists from Last.fm (15 artists)
      const similarArtists = await lastfm.getSimilarArtists(
        artistName,
        this.lastfmApiKey,
        15,
      )

      // 2. Get songs from similar artists (2-3 songs each = ~30-45 songs)
      for (const similar of similarArtists) {
        try {
          const artistResult = await subsonic.search.searchArtists(similar.name)
          if (artistResult.length > 0) {
            const artist = artistResult[0]
            const artistSongs = await subsonic.artists.getTopSongs(
              artist.id,
              3, // 3 songs per similar artist
            )
            songs.push(...artistSongs)

            if (songs.length >= 50) break
          }
        } catch (err) {
          console.warn(`Could not fetch songs for ${similar.name}:`, err)
        }
      }

      // 3. Fill up with more from the original artist if needed
      if (songs.length < 50 && artistId) {
        try {
          const additionalNeeded = 50 - songs.length
          const artistSongs = await subsonic.artists.getTopSongs(
            artistId,
            additionalNeeded,
          )
          songs.push(...artistSongs)
        } catch (err) {
          console.warn('Could not fetch additional artist songs:', err)
        }
      }

      // 4. Shuffle and limit to exactly 50
      return this.shuffleAndLimit(songs, 50)
    } catch (error) {
      console.error('Error generating Rabbit Hole for artist:', error)
      throw new Error('Failed to generate Rabbit Hole')
    }
  }

  /**
   * Generate Rabbit Hole queue for an album
   */
  async generateForAlbum(
    artistName: string,
    albumName: string,
    albumId: string,
  ): Promise<ISong[]> {
    const songs: ISong[] = []

    try {
      // 1. Get the album's songs first
      const albumSongs = await subsonic.albums.getAlbum(albumId)
      songs.push(...albumSongs.song)

      // 2. Get similar artists
      const similarArtists = await lastfm.getSimilarArtists(
        artistName,
        this.lastfmApiKey,
        15,
      )

      // 3. Get songs from similar artists
      for (const similar of similarArtists) {
        if (songs.length >= 50) break

        try {
          const artistResult = await subsonic.search.searchArtists(similar.name)
          if (artistResult.length > 0) {
            const artist = artistResult[0]
            const artistSongs = await subsonic.artists.getTopSongs(
              artist.id,
              3,
            )
            songs.push(...artistSongs)
          }
        } catch (err) {
          console.warn(`Could not fetch songs for ${similar.name}:`, err)
        }
      }

      // 4. Fill with random songs from library if still not enough
      if (songs.length < 50) {
        try {
          const randomSongs = await subsonic.songs.getRandomSongs(
            50 - songs.length,
          )
          songs.push(...randomSongs)
        } catch (err) {
          console.warn('Could not fetch random songs:', err)
        }
      }

      return this.shuffleAndLimit(songs, 50)
    } catch (error) {
      console.error('Error generating Rabbit Hole for album:', error)
      throw new Error('Failed to generate Rabbit Hole')
    }
  }

  /**
   * Generate Rabbit Hole queue for a song
   */
  async generateForSong(
    artistName: string,
    trackName: string,
  ): Promise<ISong[]> {
    // For songs, use artist-based approach
    return this.generateForArtist(artistName)
  }

  /**
   * Shuffle array and limit to specified count
   */
  private shuffleAndLimit<T>(array: T[], limit: number): T[] {
    // Fisher-Yates shuffle
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, limit)
  }
}

// Singleton instance
let rabbitHoleInstance: RabbitHoleService | null = null

export function getRabbitHoleService(lastfmApiKey: string): RabbitHoleService {
  if (!rabbitHoleInstance || rabbitHoleInstance['lastfmApiKey'] !== lastfmApiKey) {
    rabbitHoleInstance = new RabbitHoleService(lastfmApiKey)
  }
  return rabbitHoleInstance
}
