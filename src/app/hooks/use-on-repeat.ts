import { useQuery } from '@tanstack/react-query'
import { useAppIntegrations } from '@/store/app.store'
import { getOnRepeat, findTrackInNavidrome } from '@/service/lastfm-features'
import type { Song } from '@/types/responses/song'

interface OnRepeatData {
  song: Song | null
  playcount: number
  lastfmTrackName: string
  lastfmArtistName: string
}

/**
 * Hook to get the "On Repeat" track - most played in last 7 days
 * Fetches from Last.fm and finds matching song in Navidrome
 */
export function useOnRepeat() {
  const { lastfm } = useAppIntegrations()
  const isConfigured = !!(lastfm.username && lastfm.apiKey)

  return useQuery<OnRepeatData | null>({
    queryKey: ['onRepeat', lastfm.username],
    queryFn: async () => {
      if (!isConfigured) {
        return null
      }

      // Get most played track from Last.fm
      const result = await getOnRepeat({
        username: lastfm.username,
        apiKey: lastfm.apiKey,
      })

      if (!result.track || result.error || !result.artistName || !result.trackName) {
        console.warn('[On Repeat] No track found:', result.error || 'Missing data')
        return null
      }

      const artistName = result.artistName
      const trackName = result.trackName

      console.log('[On Repeat] Looking for:', { artistName, trackName })

      // Find matching song in Navidrome
      const song = await findTrackInNavidrome(artistName, trackName)

      if (!song) {
        console.warn(`[On Repeat] Track not found in Navidrome: ${artistName} - ${trackName}`)
        return null
      }

      console.log('[On Repeat] Success! Found song:', song)

      return {
        song,
        playcount: result.playcount,
        lastfmTrackName: trackName,
        lastfmArtistName: artistName,
      }
    },
    enabled: isConfigured,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  })
}
