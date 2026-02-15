import { useState, useCallback, useRef } from 'react'
import {
  loadPlaylist,
  generateAndSavePlaylist,
} from '@/service/discover-weekly-manager'
import { useAppIntegrations } from '@/store/app.store'
import type { Song } from '@/types/responses/song'

interface PlaylistMetadata {
  generatedAt: string
  artistsUsed: string[]
  totalSongs: number
  weekKey: string
}

export function useDiscoverWeekly() {
  const { lastfm } = useAppIntegrations()
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<PlaylistMetadata | null>(null)
  const hasCheckedCatchupRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const isConfigured = !!(lastfm.username && lastfm.apiKey)

  // TEMPORARILY DISABLED ALL useEffects FOR DEBUGGING
  // TODO: Re-enable after fixing sync state issue

  // Manual generation (force=true)
  const generate = useCallback(async () => {
    if (!isConfigured) {
      setError('Last.fm not configured')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateAndSavePlaylist(
        {
          username: lastfm.username,
          apiKey: lastfm.apiKey,
          targetArtists: 15,
          songsPerArtist: 4,
        },
        true // Force regeneration
      )

      setPlaylist(result.playlist)
      setMetadata(result.metadata)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      setError(message)
      console.error('[DiscoverWeekly Hook] Manual generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [isConfigured, lastfm.username, lastfm.apiKey])

  return {
    playlist,
    isGenerating,
    error,
    lastGenerated: metadata?.generatedAt || null,
    artistsUsed: metadata?.artistsUsed || [],
    weekKey: metadata?.weekKey || null,
    generate,
    isConfigured,
  }
}
