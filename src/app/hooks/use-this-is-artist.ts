import { useCallback, useEffect, useState } from 'react'
import {
  checkAndCatchUp,
  generateAndSavePlaylist,
  loadPlaylist,
  startDailyScheduler,
} from '@/service/this-is-artist-manager'
import { useAppStore } from '@/store/app.store'
import type { ISimilarArtist } from '@/types/responses/artist'
import type { Song } from '@/types/responses/song'
import { logger } from '@/utils/logger'

interface UseThisIsArtistReturn {
  playlist: Song[]
  artist: ISimilarArtist | null
  isGenerating: boolean
  error: string | null
  lastGenerated: string | null
  dateKey: string | null
  generate: () => Promise<void>
  isConfigured: boolean
}

export function useThisIsArtist(): UseThisIsArtistReturn {
  const lastfmConfig = useAppStore((state) => state.integrations.lastfm)
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [artist, setArtist] = useState<ISimilarArtist | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [dateKey, setDateKey] = useState<string | null>(null)

  const isConfigured = Boolean(lastfmConfig.username && lastfmConfig.apiKey)

  // Load playlist from storage
  const loadFromStorage = useCallback(() => {
    const startedAt = performance.now()
    const { playlist: storedPlaylist, metadata } = loadPlaylist()
    if (metadata) {
      setPlaylist(storedPlaylist)
      setArtist(metadata.artist)
      setLastGenerated(metadata.generatedAt)
      setDateKey(metadata.dateKey)
    }
    logger.info('[Perf][ThisIsArtist] Loaded from storage', {
      elapsedMs: Math.round(performance.now() - startedAt),
      songs: storedPlaylist.length,
      hasMetadata: Boolean(metadata),
    })
  }, [])

  // Generate playlist
  const generate = useCallback(async () => {
    if (!isConfigured) {
      setError('Last.fm not configured')
      return
    }

    setIsGenerating(true)
    setError(null)
    const startedAt = performance.now()

    try {
      const result = await generateAndSavePlaylist(
        {
          username: lastfmConfig.username,
          apiKey: lastfmConfig.apiKey,
        },
        true, // Force generation
      )

      setPlaylist(result.playlist)
      setArtist(result.metadata.artist)
      setLastGenerated(result.metadata.generatedAt)
      setDateKey(result.metadata.dateKey)
      setError(null)

      logger.info(
        `[ThisIsArtist Hook] Generated: This is ${result.metadata.artist.name}`,
      )
      logger.info('[Perf][ThisIsArtist] Manual generation finished', {
        elapsedMs: Math.round(performance.now() - startedAt),
        songs: result.playlist.length,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('[ThisIsArtist Hook] Generation failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [isConfigured, lastfmConfig.username, lastfmConfig.apiKey])

  // Initial load and catch-up check
  useEffect(() => {
    if (!isConfigured) return

    // Load existing playlist
    loadFromStorage()

    // Check if catch-up is needed
    const runCatchUp = async () => {
      const startedAt = performance.now()
      try {
        const generated = await checkAndCatchUp({
          username: lastfmConfig.username,
          apiKey: lastfmConfig.apiKey,
        })

        if (generated) {
          // Reload after catch-up generation
          loadFromStorage()
        }
        logger.info('[Perf][ThisIsArtist] Catch-up finished', {
          elapsedMs: Math.round(performance.now() - startedAt),
          generated,
        })
      } catch (err) {
        console.error('[ThisIsArtist Hook] Catch-up failed:', err)
      }
    }

    runCatchUp()
  }, [
    isConfigured,
    lastfmConfig.username,
    lastfmConfig.apiKey,
    loadFromStorage,
  ])

  // Start scheduler
  useEffect(() => {
    if (!isConfigured) return

    const cleanup = startDailyScheduler(
      {
        username: lastfmConfig.username,
        apiKey: lastfmConfig.apiKey,
      },
      (success) => {
        if (success) {
          loadFromStorage()
        }
      },
    )

    return cleanup
  }, [
    isConfigured,
    lastfmConfig.username,
    lastfmConfig.apiKey,
    loadFromStorage,
  ])

  return {
    playlist,
    artist,
    isGenerating,
    error,
    lastGenerated,
    dateKey,
    generate,
    isConfigured,
  }
}
