import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { subsonic } from '@/service/subsonic'
import { usePlayerMediaType, usePlayerSonglist } from '@/store/player.store'

const LYRICS_PREFETCH_DELAY_MS = 450
const LYRICS_STALE_TIME_MS = 10 * 60 * 1000
const LYRICS_GC_TIME_MS = 30 * 60 * 1000
const LYRICS_PREFETCH_RECENT_TTL_MS = 60_000

export function buildLyricsQueryKey(
  artist?: string,
  title?: string,
  duration?: number,
) {
  return ['get-lyrics', artist ?? '', title ?? '', duration ?? 0] as const
}

export function buildLyricsPrefetchSongs(
  currentList: Array<{
    id?: string
    artist?: string
    title?: string
    duration?: number
  }>,
  currentSongIndex: number,
) {
  const nextSong = currentList[currentSongIndex + 1]
  if (!nextSong?.id) return []
  return [nextSong]
}

export function LyricsPrefetchObserver() {
  const queryClient = useQueryClient()
  const { isSong } = usePlayerMediaType()
  const { currentList, currentSongIndex } = usePlayerSonglist()
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inflightPrefetchKeyRef = useRef<string | null>(null)
  const recentPrefetchesRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current)
      prefetchTimerRef.current = null
    }
    if (!isSong) return

    const songsToPrefetch = buildLyricsPrefetchSongs(
      currentList,
      currentSongIndex,
    )
    if (songsToPrefetch.length === 0) return

    prefetchTimerRef.current = setTimeout(() => {
      songsToPrefetch.forEach((song) => {
        const queryKey = buildLyricsQueryKey(
          song.artist,
          song.title,
          song.duration,
        )
        const queryKeyAsString = queryKey.join('|')
        const now = Date.now()
        const recent = recentPrefetchesRef.current.get(queryKeyAsString)
        if (
          inflightPrefetchKeyRef.current === queryKeyAsString ||
          (recent && now - recent < LYRICS_PREFETCH_RECENT_TTL_MS)
        ) {
          return
        }

        const existingState = queryClient.getQueryState(queryKey)
        if (
          existingState?.data !== undefined &&
          existingState?.dataUpdatedAt &&
          now - existingState.dataUpdatedAt < LYRICS_STALE_TIME_MS
        ) {
          return
        }

        inflightPrefetchKeyRef.current = queryKeyAsString

        queryClient
          .prefetchQuery({
            queryKey,
            queryFn: () =>
              subsonic.lyrics.getLyrics({
                id: song.id,
                artist: song.artist,
                title: song.title,
                duration: song.duration,
              }),
            staleTime: LYRICS_STALE_TIME_MS,
            gcTime: LYRICS_GC_TIME_MS,
          })
          .catch(() => undefined)
          .finally(() => {
            if (inflightPrefetchKeyRef.current === queryKeyAsString) {
              inflightPrefetchKeyRef.current = null
            }
            recentPrefetchesRef.current.set(queryKeyAsString, Date.now())
          })
      })
    }, LYRICS_PREFETCH_DELAY_MS)

    return () => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current)
        prefetchTimerRef.current = null
      }
    }
  }, [currentList, currentSongIndex, isSong, queryClient])

  return null
}
