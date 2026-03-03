import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePlaylistDialog } from '@/app/context/playlist-dialog-context'
import { findTracksInNavidrome, getTop50Year } from '@/service/lastfm-features'
import { useAppIntegrations } from '@/store/app.store'
import type { Song } from '@/types/responses/song'
import { logger } from '@/utils/logger'
import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'

interface Top50YearData {
  playlist: Song[]
  totalTracks: number
  lastGenerated: string | null
  year: number
}

const CACHE_KEY = 'top50Year'

/**
 * Hook to get Top 50 tracks from the last 12 months
 * Fetches from Last.fm and finds matching songs in Navidrome
 */
export function useTop50Year() {
  const { lastfm } = useAppIntegrations()
  const queryClient = useQueryClient()
  const { showPlaylistSaved } = usePlaylistDialog()
  const isConfigured = !!(lastfm.username && lastfm.apiKey)

  const currentYear = new Date().getFullYear()

  // Get cached data from localStorage
  const getCachedData = (): Top50YearData | null => {
    try {
      const cached = safeStorageGet(CACHE_KEY)
      if (!cached) return null
      return JSON.parse(cached)
    } catch {
      return null
    }
  }

  // Save data to localStorage
  const setCachedData = (data: Top50YearData) => {
    try {
      safeStorageSet(CACHE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('[Top 50 Year] Failed to cache data:', error)
    }
  }

  // Main query - loads from cache
  const query = useQuery<Top50YearData>({
    queryKey: ['top50Year', lastfm.username],
    queryFn: async () => {
      const cached = getCachedData()
      if (cached) {
        logger.info('[Top 50 Year] Loaded from cache:', cached)
        return cached
      }

      // Return empty state if no cache
      return {
        playlist: [],
        totalTracks: 0,
        lastGenerated: null,
        year: currentYear,
      }
    },
    enabled: isConfigured,
    staleTime: Infinity, // Never auto-refetch, only on demand
    gcTime: Infinity,
  })

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!isConfigured) {
        throw new Error('Last.fm not configured')
      }

      logger.info('[Top 50 Year] Generating playlist...')

      // Get top 50 tracks from Last.fm
      const result = await getTop50Year({
        username: lastfm.username,
        apiKey: lastfm.apiKey,
      })

      if (result.error || result.tracks.length === 0) {
        throw new Error(result.error || 'No tracks found')
      }

      logger.info(
        '[Top 50 Year] Found',
        result.tracks.length,
        'tracks from Last.fm',
      )

      // Extract track info
      const tracksToFind = result.tracks.map((track) => {
        const artistName =
          track.artist?.['#text'] ||
          track.artist?.name ||
          (typeof track.artist === 'string' ? track.artist : 'Unknown')

        return {
          artistName,
          trackName: track.name,
          playcount: parseInt(track.playcount || '0', 10),
        }
      })

      // Find all tracks in Navidrome
      logger.info('[Top 50 Year] Searching for tracks in Navidrome...')
      const foundSongs = await findTracksInNavidrome(tracksToFind)

      // Filter out nulls
      const playlist = foundSongs.filter((song): song is Song => song !== null)

      logger.info('[Top 50 Year] Found', playlist.length, 'tracks in Navidrome')

      const data: Top50YearData = {
        playlist,
        totalTracks: playlist.length,
        lastGenerated: new Date().toISOString(),
        year: currentYear,
      }

      // Cache the data
      setCachedData(data)

      return data
    },
    onSuccess: (data) => {
      // Update query cache
      queryClient.setQueryData(['top50Year', lastfm.username], data)
      logger.info('[Top 50 Year] Playlist generated successfully')

      // Show modal dialog
      showPlaylistSaved('Top 50 des Jahres', data.totalTracks)
    },
    onError: (error) => {
      console.error('[Top 50 Year] Generation failed:', error)
    },
  })

  return {
    playlist: query.data?.playlist || [],
    totalTracks: query.data?.totalTracks || 0,
    lastGenerated: query.data?.lastGenerated || null,
    year: query.data?.year || currentYear,
    isLoading: query.isLoading,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error?.message,
    generate: generateMutation.mutate,
    isConfigured,
  }
}
