import { useCallback, useEffect, useState } from 'react'
import type { Song } from '@/types/responses/song'
import {
  checkAndCatchUpTimeOfDayPlaylist,
  generateAndSaveTimeOfDayPlaylist,
  loadTimeOfDayPlaylist,
  startTimeOfDayScheduler,
} from '@/service/time-of-day-playlist-manager'
import type { DayPart } from '@/service/time-of-day-playlist'

interface TimeOfDayState {
  playlist: Song[]
  dayPart: DayPart
  generatedAt: string | null
  genresUsed: string[]
}

export function useTimeOfDayPlaylist() {
  const [state, setState] = useState<TimeOfDayState>({
    playlist: [],
    dayPart: 'morning',
    generatedAt: null,
    genresUsed: [],
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFromStorage = useCallback(() => {
    const { playlist, metadata } = loadTimeOfDayPlaylist()
    if (!metadata) return

    setState({
      playlist,
      dayPart: metadata.dayPart,
      generatedAt: metadata.generatedAt,
      genresUsed: metadata.genresUsed,
    })
  }, [])

  const generate = useCallback(async (force: boolean = true) => {
    setIsGenerating(true)
    setError(null)

    try {
      const { playlist, metadata } = await generateAndSaveTimeOfDayPlaylist(force)
      setState({
        playlist,
        dayPart: metadata.dayPart,
        generatedAt: metadata.generatedAt,
        genresUsed: metadata.genresUsed,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  useEffect(() => {
    loadFromStorage()

    const runCatchUp = async () => {
      const generated = await checkAndCatchUpTimeOfDayPlaylist()
      if (generated) {
        loadFromStorage()
      }
    }

    runCatchUp()
  }, [loadFromStorage])

  useEffect(() => {
    const cleanup = startTimeOfDayScheduler((success) => {
      if (success) {
        loadFromStorage()
      }
    })
    return cleanup
  }, [loadFromStorage])

  return {
    playlist: state.playlist,
    dayPart: state.dayPart,
    generatedAt: state.generatedAt,
    genresUsed: state.genresUsed,
    isGenerating,
    error,
    generate,
  }
}
