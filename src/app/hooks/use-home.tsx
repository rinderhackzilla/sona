import { useQueries, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { subsonic } from '@/service/subsonic'
import { AlbumsListData } from '@/types/responses/album'
import { Genres } from '@/types/responses/genre'
import { convertMinutesToMs } from '@/utils/convertSecondsToTime'
import { queryKeys } from '@/utils/queryKeys'

const HOME_QUERY_BASE = {
  staleTime: convertMinutesToMs(10),
  gcTime: convertMinutesToMs(30),
  refetchOnWindowFocus: false as const,
}

function createHomeAlbumListQuery(
  key: string,
  type: 'newest' | 'frequent' | 'recent' | 'random',
  size = 16,
) {
  return {
    queryKey: [key],
    queryFn: () =>
      subsonic.albums.getAlbumList({
        size,
        type,
      }),
  }
}

export interface GenreDiscoveryItem {
  value: string
  albumCount: number
}

function deriveGenreDiscoveryItems(
  genres?: Genres,
  mostPlayed?: AlbumsListData,
): GenreDiscoveryItem[] {
  const topGenres = (() => {
    if (!mostPlayed?.list) return []
    const genreCounts = new Map<string, number>()
    mostPlayed.list.forEach((album) => {
      if (!album.genre) return
      genreCounts.set(album.genre, (genreCounts.get(album.genre) || 0) + 1)
    })
    return Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)
  })()

  const selectedGenres = (() => {
    if (topGenres.length > 0) return topGenres
    if (!genres || genres.length === 0) return []
    return [...genres]
      .sort((a, b) => (b.songCount || 0) - (a.songCount || 0))
      .slice(0, 3)
      .map((genre) => genre.value)
  })()

  if (selectedGenres.length === 0) return []

  const genresMap = new Map((genres || []).map((genre) => [genre.value, genre]))
  return selectedGenres.map((genreValue) => ({
    value: genreValue,
    albumCount: genresMap.get(genreValue)?.albumCount ?? 0,
  }))
}

export const useGetRandomSongs = () => {
  return useQuery({
    queryKey: [queryKeys.song.random],
    queryFn: () => subsonic.songs.getRandomSongs({ size: 10 }),
    ...HOME_QUERY_BASE,
  })
}

export const useGetRecentlyAdded = () => {
  return useQuery({
    ...createHomeAlbumListQuery(queryKeys.album.recentlyAdded, 'newest'),
    ...HOME_QUERY_BASE,
  })
}

export const useGetMostPlayed = () => {
  return useQuery({
    ...createHomeAlbumListQuery(queryKeys.album.mostPlayed, 'frequent'),
    ...HOME_QUERY_BASE,
  })
}

export const useGetRecentlyPlayed = () => {
  return useQuery({
    ...createHomeAlbumListQuery(queryKeys.album.recentlyPlayed, 'recent'),
    refetchInterval: convertMinutesToMs(2),
    staleTime: convertMinutesToMs(1),
    gcTime: convertMinutesToMs(20),
    refetchOnWindowFocus: false,
  })
}

export const useGetRandomAlbums = () => {
  return useQuery({
    ...createHomeAlbumListQuery(queryKeys.album.random, 'random'),
    ...HOME_QUERY_BASE,
  })
}

export const useHomeFeedData = () => {
  const [recentlyAdded, recentlyPlayed, mostPlayed] = useQueries({
    queries: [
      {
        ...createHomeAlbumListQuery(queryKeys.album.recentlyAdded, 'newest'),
        ...HOME_QUERY_BASE,
      },
      {
        ...createHomeAlbumListQuery(queryKeys.album.recentlyPlayed, 'recent'),
        refetchInterval: convertMinutesToMs(2),
        staleTime: convertMinutesToMs(1),
        gcTime: convertMinutesToMs(20),
        refetchOnWindowFocus: false,
      },
      {
        ...createHomeAlbumListQuery(queryKeys.album.mostPlayed, 'frequent'),
        ...HOME_QUERY_BASE,
      },
    ],
  })

  const similarArtists = useGetSimilarArtistsDiscovery()

  return {
    similarArtists,
    recentlyAdded,
    recentlyPlayed,
    mostPlayed,
  }
}

export const useHomeDashboardData = () => {
  const feed = useHomeFeedData()
  const genresQuery = useGetGenres()

  const genres = useMemo(
    () => deriveGenreDiscoveryItems(genresQuery.data, feed.mostPlayed.data),
    [feed.mostPlayed.data, genresQuery.data],
  )

  return {
    ...feed,
    genres,
    isGenresLoading: genresQuery.isLoading || feed.mostPlayed.isLoading,
  }
}

// Get all genres
export const useGetGenres = () => {
  return useQuery({
    queryKey: [queryKeys.genre.all],
    queryFn: () => subsonic.genres.get(),
    staleTime: convertMinutesToMs(30),
    gcTime: convertMinutesToMs(60),
    refetchOnWindowFocus: false,
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
    staleTime: convertMinutesToMs(15),
    gcTime: convertMinutesToMs(45),
    refetchOnWindowFocus: false,
  })
}

// Get genre discovery: pick random popular genres and fetch albums
export const useGetGenreDiscovery = () => {
  const { data: genres, isLoading: genresLoading } = useGetGenres()
  const { data: mostPlayed } = useGetMostPlayed()
  const selectedGenreItems = useMemo(
    () => deriveGenreDiscoveryItems(genres, mostPlayed),
    [genres, mostPlayed],
  )

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
  const { topGenres, topArtistIds } = useMemo(() => {
    const artistCounts = new Map<
      string,
      { count: number; id: string; genre?: string }
    >()
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
        const current = artistCounts.get(album.artist) || {
          count: 0,
          id: album.artistId,
          genre: album.genre,
        }
        artistCounts.set(album.artist, {
          ...current,
          count: current.count + 1,
        })
      }

      if (album.genre) {
        genreCounts.set(album.genre, (genreCounts.get(album.genre) || 0) + 1)
      }
    })

    // Get top 3 genres
    const topGenresList = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)

    return {
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
      const randomGenre =
        topGenres[Math.floor(Math.random() * topGenres.length)]
      const albums = await subsonic.albums.getAlbumList({
        size: 50, // Get more to filter
        type: 'byGenre',
        genre: randomGenre,
      })

      if (!albums?.list) return { list: [], albumsCount: 0 }

      // Filter out albums from top artists (to show discovery)
      const discoveryAlbums = albums.list.filter(
        (album) => !topArtistIds.includes(album.artistId || ''),
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
    staleTime: convertMinutesToMs(10),
    gcTime: convertMinutesToMs(30),
    refetchOnWindowFocus: false,
  })
}
