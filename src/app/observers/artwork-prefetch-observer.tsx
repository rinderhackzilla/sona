import { useEffect, useRef } from 'react'
import { prefetchCoverArtUrls } from '@/api/httpClient'
import { usePlayerMediaType, usePlayerSonglist } from '@/store/player.store'
import { runWithRetry } from '@/utils/background-task-runner'

const ARTWORK_PREFETCH_DELAY_MS = 900
const ARTWORK_PREFETCH_RECENT_TTL_MS = 45_000

type PrefetchCover = { id: string; type: 'song'; size: '300' }

export function buildArtworkPrefetchCovers(
  currentList: Array<{ id: string; coverArt?: string }>,
  currentSongIndex: number,
): PrefetchCover[] {
  const nextSongs = [
    currentList[currentSongIndex + 1],
    currentList[currentSongIndex + 2],
    currentList[currentSongIndex + 3],
  ].filter(Boolean)

  const seen = new Set<string>()
  const covers: PrefetchCover[] = []

  for (const song of nextSongs) {
    if (!song.coverArt || seen.has(song.coverArt)) continue
    seen.add(song.coverArt)
    covers.push({
      id: song.coverArt,
      type: 'song',
      size: '300',
    })
  }

  return covers
}

export function ArtworkPrefetchObserver() {
  const { currentList, currentSongIndex } = usePlayerSonglist()
  const { isSong } = usePlayerMediaType()
  const inflightPrefetchKeyRef = useRef<string | null>(null)
  const recentPrefetchesRef = useRef<Map<string, number>>(new Map())
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current)
      prefetchTimerRef.current = null
    }

    if (!isSong) return
    const covers = buildArtworkPrefetchCovers(currentList, currentSongIndex)

    if (covers.length === 0) return
    const prefetchKey = covers.map((cover) => cover.id).join('|')
    if (!prefetchKey) return

    prefetchTimerRef.current = setTimeout(() => {
      const now = Date.now()
      const recent = recentPrefetchesRef.current.get(prefetchKey)
      if (
        inflightPrefetchKeyRef.current === prefetchKey ||
        (recent && now - recent < ARTWORK_PREFETCH_RECENT_TTL_MS)
      ) {
        return
      }
      inflightPrefetchKeyRef.current = prefetchKey

      // Keep the recent map small and fresh.
      recentPrefetchesRef.current.forEach((timestamp, key) => {
        if (now - timestamp > ARTWORK_PREFETCH_RECENT_TTL_MS * 3) {
          recentPrefetchesRef.current.delete(key)
        }
      })

      runWithRetry(() => prefetchCoverArtUrls(covers), {
        taskName: 'artwork-prefetch-next-songs',
        policy: {
          retries: 1,
          baseDelayMs: 300,
          maxDelayMs: 1200,
        },
      })
        .catch(() => undefined)
        .finally(() => {
          if (inflightPrefetchKeyRef.current === prefetchKey) {
            inflightPrefetchKeyRef.current = null
          }
          recentPrefetchesRef.current.set(prefetchKey, Date.now())
        })
    }, ARTWORK_PREFETCH_DELAY_MS)

    return () => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current)
        prefetchTimerRef.current = null
      }
    }
  }, [currentList, currentSongIndex, isSong])

  return null
}
