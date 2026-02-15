import { useState, useEffect, useCallback } from 'react'
import { generateDiscoverWeekly, shouldRegeneratePlaylist } from '@/service/discover-weekly'
import type { Song } from '@/types/responses/song'

const STORAGE_KEY = 'discover_weekly_playlist'
const STORAGE_KEY_METADATA = 'discover_weekly_metadata'
const STORAGE_KEY_LASTFM = 'lastfm_config'

interface LastFmConfig {
  username: string
  apiKey: string
}

interface PlaylistMetadata {
  generatedAt: string
  artistsUsed: string[]
  totalSongs: number
}

export function useDiscoverWeekly() {
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [artistsUsed, setArtistsUsed] = useState<string[]>([])

  // Load Last.fm config
  const getLastFmConfig = useCallback((): LastFmConfig | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LASTFM)
      if (!stored) return null
      const config = JSON.parse(stored)
      if (!config.username || !config.apiKey) return null
      return config
    } catch {
      return null
    }
  }, [])

  const isConfigured = getLastFmConfig() !== null

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
    const config = getLastFmConfig()
    if (!config) {
      setError('Last.fm not configured')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateDiscoverWeekly({
        username: config.username,
        apiKey: config.apiKey,
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
  }, [getLastFmConfig])

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
