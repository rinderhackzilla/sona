import { useEffect } from 'react'
import { prefetchCoverArtUrls } from '@/api/httpClient'
import { usePlayerSonglist, usePlayerMediaType } from '@/store/player.store'
import { runWithRetry } from '@/utils/background-task-runner'

export function ArtworkPrefetchObserver() {
  const { currentList, currentSongIndex } = usePlayerSonglist()
  const { isSong } = usePlayerMediaType()

  useEffect(() => {
    if (!isSong) return
    const nextSongs = [currentList[currentSongIndex + 1], currentList[currentSongIndex + 2]]
      .filter(Boolean)
      .filter((song) => Boolean(song.coverArt))

    if (nextSongs.length === 0) return

    runWithRetry(
      () =>
        prefetchCoverArtUrls(
          nextSongs.map((nextSong) => ({
            id: nextSong.coverArt,
            type: 'song',
            size: '500',
          })),
        ),
      {
        taskName: 'artwork-prefetch-next-songs',
        policy: {
          retries: 1,
          baseDelayMs: 300,
          maxDelayMs: 1200,
        },
      },
    ).catch(() => undefined)
  }, [currentList, currentSongIndex, isSong])

  return null
}
