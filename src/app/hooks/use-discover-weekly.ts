import { useState, useEffect, useCallback } from 'react'
import { generateDiscoverWeekly, shouldRegeneratePlaylist } from '@/service/discover-weekly'
import { useAppIntegrations } from '@/store/app.store'
import type { Song } from '@/types/responses/song'

const STORAGE_KEY = 'discover_weekly_playlist'
const STORAGE_KEY_METADATA = 'discover_weekly_metadata'

interface PlaylistMetadata {
  generatedAt: string
  artistsUsed: string[]
  totalSongs: number
}

export function useDiscoverWeekly() {
  const { lastfm } = useAppIntegrations()
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [artistsUsed, setArtistsUsed] = useState<string[]>([])

  const isConfigured = !!(lastfm.username && lastfm.apiKey)

  // Load playlist from localStorage
  useEffect(() => {
    try {
      const storedPlaylist = localStorage.getItem(STORAGE_KEY)
      const storedMetadata = localStorage.getItem(STORAGE_KEY_METADATA)

      if (storedPlaylist && storedMetadata) {
        const parsedPlaylist = JSON.parse(storedPlaylist)
        const parsedMetadata: PlaylistMetadata = JSON.parse(storedMetadata)

        setPlaylist(parsedPlaylist)
        setLastGenerated(parsedMetadata.generatedAt)
        setArtistsUsed(parsedMetadata.artistsUsed)
      }
    } catch (error) {
      console.error('[DiscoverWeekly] Failed to load from storage:', error)
    }
  }, [])

  // Generate new playlist
  const generate = useCallback(async () => {
    if (!isConfigured) {
      setError('Last.fm not configured')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateDiscoverWeekly({
        username: lastfm.username,
        apiKey: lastfm.apiKey,
        targetArtists: 15,
        songsPerArtist: 4,
      })

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.playlist))
      localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(result.metadata))

      // Update state
      setPlaylist(result.playlist)
      setLastGenerated(result.metadata.generatedAt)
      setArtistsUsed(result.metadata.artistsUsed)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setError(message)
      console.error('[DiscoverWeekly] Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [isConfigured, lastfm.username, lastfm.apiKey])

  // Check if playlist should be regenerated
  const checkAndRegenerate = useCallback(async () => {
    const shouldRegenerate = await shouldRegeneratePlaylist(lastGenerated)
    if (shouldRegenerate) {
      console.log('[DiscoverWeekly] Auto-regenerating playlist (Monday)')
      await generate()
    }
  }, [lastGenerated, generate])

  // Auto-check every hour if it's Monday and needs regeneration
  useEffect(() => {
    if (!isConfigured) return

    // Check immediately
    checkAndRegenerate()

    // Check every hour
    const interval = setInterval(() => {
      checkAndRegenerate()
    }, 60 * 60 * 1000) // 1 hour

    return () => clearInterval(interval)
  }, [isConfigured, checkAndRegenerate])

  return {
    playlist,
    isGenerating,
    error,
    lastGenerated,
    artistsUsed,
    generate,
    checkAndRegenerate,
    isConfigured,
  }
}
