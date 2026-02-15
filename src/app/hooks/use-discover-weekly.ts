import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadPlaylist,
  generateAndSavePlaylist,
  shouldGeneratePlaylist,
  checkAndCatchUp,
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

  const isConfigured = !!(lastfm.username && lastfm.apiKey)

  // Load playlist from localStorage on mount
  useEffect(() => {
    const { playlist: storedPlaylist, metadata: storedMetadata } = loadPlaylist()
    
    if (storedPlaylist.length > 0 && storedMetadata) {
      setPlaylist(storedPlaylist)
      setMetadata(storedMetadata)
    }
  }, [])

  // Catch-up check on mount (only once per session)
  useEffect(() => {
    if (!isConfigured || hasCheckedCatchupRef.current) {
      return
    }

    const performCatchup = async () => {
      // Mark as checked (using ref to avoid re-renders)
      hasCheckedCatchupRef.current = true
      
      // Check if generation is needed
      if (!shouldGeneratePlaylist()) {
        console.log('[DiscoverWeekly Hook] No catch-up needed')
        return
      }

      console.log('[DiscoverWeekly Hook] Performing catch-up generation...')
      setIsGenerating(true)
      setError(null)

      try {
        const success = await checkAndCatchUp({
          username: lastfm.username,
          apiKey: lastfm.apiKey,
          targetArtists: 15,
          songsPerArtist: 4,
        })

        if (success) {
          // Reload playlist after generation
          const { playlist: newPlaylist, metadata: newMetadata } = loadPlaylist()
          setPlaylist(newPlaylist)
          setMetadata(newMetadata)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Catch-up failed'
        setError(message)
        console.error('[DiscoverWeekly Hook] Catch-up error:', error)
      } finally {
        setIsGenerating(false)
      }
    }

    // Delay by 2 seconds to not block initial render
    const timeoutId = setTimeout(performCatchup, 2000)
    return () => clearTimeout(timeoutId)
  }, [isConfigured, lastfm.username, lastfm.apiKey])

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
