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

  const selectedGenreItems = useMemo(() => {
    if (!selectedGenres.length) return []

    const genresMap = new Map((genres || []).map((genre) => [genre.value, genre]))

    return selectedGenres.map((genreValue) => {
      const genreData = genresMap.get(genreValue)
      return {
        value: genreValue,
        albumCount: genreData?.albumCount ?? 0,
      }
    })
  }, [selectedGenres, genres])

  return {
    genres: selectedGenreItems,
    isLoading: genresLoading,
  }
}

// Get similar artists discovery based on listening history
export const useGetSimilarArtistsDiscovery = () => {
  const { data: mostPlayed } = useGetMostPlayed()
  const { data: recentlyPlayed } = useGetRecentlyPlayed()

  // Extract top artists and genres from listening history
  const { topArtists, topGenres, topArtistIds } = useMemo(() => {
    const artistCounts = new Map<string, { count: number; id: string; genre?: string }>()
    const genreCounts = new Map<string, number>()
    const artistIds = new Set<string>()

    // Combine most played and recently played
    const allAlbums = [
      ...(mostPlayed?.list || []),
      ...(recentlyPlayed?.list || []),
    ]

    allAlbums.forEach((album) => {
      if (album.artist && album.artistId) {
        artistIds.add(album.artistId)
        const current = artistCounts.get(album.artist) || { count: 0, id: album.artistId, genre: album.genre }
        artistCounts.set(album.artist, {
          ...current,
          count: current.count + 1,
        })
      }

      if (album.genre) {
        genreCounts.set(album.genre, (genreCounts.get(album.genre) || 0) + 1)
      }
    })

    // Get top 5 artists
    const topArtistsList = Array.from(artistCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }))

    // Get top 3 genres
    const topGenresList = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)

    return {
      topArtists: topArtistsList,
      topGenres: topGenresList,
      topArtistIds: Array.from(artistIds),
    }
  }, [mostPlayed, recentlyPlayed])

  // Fetch random albums from top genres (excluding top artists)
  return useQuery({
    queryKey: [queryKeys.album.similarArtists, topGenres, topArtistIds],
    queryFn: async () => {
      if (topGenres.length === 0) {
        // Fallback to random albums if no genres found
        return subsonic.albums.getAlbumList({
          size: 10,
          type: 'random',
        })
      }

      // Get albums from one of the top genres
      const randomGenre = topGenres[Math.floor(Math.random() * topGenres.length)]
      const albums = await subsonic.albums.getAlbumList({
        size: 50, // Get more to filter
        type: 'byGenre',
        genre: randomGenre,
      })

      if (!albums?.list) return { list: [], albumsCount: 0 }

      // Filter out albums from top artists (to show discovery)
      const discoveryAlbums = albums.list.filter(
        (album) => !topArtistIds.includes(album.artistId || '')
      )

      // Shuffle and take 10
      const shuffled = discoveryAlbums
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)

      return {
        list: shuffled,
        albumsCount: shuffled.length,
      }
    },
    enabled: !!mostPlayed || !!recentlyPlayed,
    staleTime: convertMinutesToMs(10), // Refresh every 10 minutes
  })
}
