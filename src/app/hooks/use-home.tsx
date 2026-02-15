import { useQuery } from '@tanstack/react-query'
import { subsonic } from '@/service/subsonic'
import { convertMinutesToMs } from '@/utils/convertSecondsToTime'
import { queryKeys } from '@/utils/queryKeys'
import { useMemo } from 'react'

export const useGetRandomSongs = () => {
  return useQuery({
    queryKey: [queryKeys.song.random],
    queryFn: () => subsonic.songs.getRandomSongs({ size: 10 }),
  })
}

export const useGetRecentlyAdded = () => {
  return useQuery({
    queryKey: [queryKeys.album.recentlyAdded],
    queryFn: () =>
      subsonic.albums.getAlbumList({
        size: 16,
        type: 'newest',
      }),
  })
}

export const useGetMostPlayed = () => {
  return useQuery({
    queryKey: [queryKeys.album.mostPlayed],
    queryFn: () =>
      subsonic.albums.getAlbumList({
        size: 16,
        type: 'frequent',
      }),
  })
}

export const useGetRecentlyPlayed = () => {
  return useQuery({
    queryKey: [queryKeys.album.recentlyPlayed],
    queryFn: () =>
      subsonic.albums.getAlbumList({
        size: 16,
        type: 'recent',
      }),
    refetchInterval: convertMinutesToMs(2),
  })
}

export const useGetRandomAlbums = () => {
  return useQuery({
    queryKey: [queryKeys.album.random],
    queryFn: () =>
      subsonic.albums.getAlbumList({
        size: 16,
        type: 'random',
      }),
  })
}

// Get all genres
export const useGetGenres = () => {
  return useQuery({
    queryKey: [queryKeys.genre.all],
    queryFn: () => subsonic.genres.get(),
    staleTime: convertMinutesToMs(30), // Genres don't change often
  })
}

// Get albums by genre
export const useGetAlbumsByGenre = (genre: string, size: number = 16) => {
  return useQuery({
    queryKey: [queryKeys.album.byGenre, genre],
    queryFn: () =>
      subsonic.albums.getAlbumList({
        size,
        type: 'byGenre',
        genre,
      }),
    enabled: !!genre,
  })
}

// Get genre discovery: pick random popular genres and fetch albums
export const useGetGenreDiscovery = () => {
  const { data: genres, isLoading: genresLoading } = useGetGenres()
  const { data: mostPlayed } = useGetMostPlayed()

  // Extract top genres from most played albums
  const topGenres = useMemo(() => {
    if (!mostPlayed?.list) return []
    
    const genreCounts = new Map<string, number>()
    
    mostPlayed.list.forEach((album) => {
      if (album.genre) {
        genreCounts.set(album.genre, (genreCounts.get(album.genre) || 0) + 1)
      }
    })
    
    // Sort by count and take top 3
    return Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)
  }, [mostPlayed])

  // If no top genres found, pick random popular genres
  const selectedGenres = useMemo(() => {
    if (topGenres.length > 0) return topGenres
    if (!genres || genres.length === 0) return []
    
    // Sort by song count and pick top 3
    return [...genres]
      .sort((a, b) => (b.songCount || 0) - (a.songCount || 0))
      .slice(0, 3)
      .map((g) => g.value)
  }, [topGenres, genres])

  return {
    genres: selectedGenres,
    isLoading: genresLoading,
  }
}
