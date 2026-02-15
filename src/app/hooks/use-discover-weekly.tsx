import { useState, useCallback } from 'react'
import { useAppIntegrations } from '@/store/app.store'
import { generateDiscoverWeekly, shouldRegeneratePlaylist } from '@/service/discover-weekly'
import type { Song } from '@/types/responses/song'

interface DiscoverWeeklyState {
  playlist: Song[]
  isGenerating: boolean
  error: string | null
  lastGenerated: string | null
  artistsUsed: string[]
}

const STORAGE_KEY = 'discover-weekly'

export function useDiscoverWeekly() {
  const { lastfm } = useAppIntegrations()

  const [state, setState] = useState<DiscoverWeeklyState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('[DiscoverWeekly] Failed to load from storage:', error)
    }
    return {
      playlist: [],
      isGenerating: false,
      error: null,
      lastGenerated: null,
      artistsUsed: [],
    }
  })

  const saveToStorage = useCallback((newState: Partial<DiscoverWeeklyState>) => {
    setState((prev) => {
      const updated = { ...prev, ...newState }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('[DiscoverWeekly] Failed to save to storage:', error)
      }
      return updated
    })
  }, [])

  const generate = useCallback(async () => {
    if (!lastfm.username || !lastfm.apiKey) {
      saveToStorage({
        error: 'Last.fm credentials not configured',
      })
      return
    }

    saveToStorage({
      isGenerating: true,
      error: null,
    })

    try {
      const result = await generateDiscoverWeekly({
        username: lastfm.username,
        apiKey: lastfm.apiKey,
        targetArtists: 15,
        songsPerArtist: 4,
      })

      saveToStorage({
        playlist: result.playlist,
        artistsUsed: result.metadata.artistsUsed,
        lastGenerated: result.metadata.generatedAt,
        isGenerating: false,
        error: null,
      })
    } catch (error) {
      console.error('[DiscoverWeekly] Generation failed:', error)
      saveToStorage({
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [lastfm.username, lastfm.apiKey, saveToStorage])

  const checkAndRegenerate = useCallback(async () => {
    const shouldRegenerate = await shouldRegeneratePlaylist(
      state.lastGenerated,
    )
    if (shouldRegenerate) {
      await generate()
    }
  }, [state.lastGenerated, generate])

  return {
    ...state,
    generate,
    checkAndRegenerate,
    isConfigured: Boolean(lastfm.username && lastfm.apiKey),
  }
}
