import { httpClient } from '@/api/httpClient'
import {
  ArtistInfoResponse,
  ArtistResponse,
  ArtistsResponse,
  ISimilarArtist,
} from '@/types/responses/artist'
import { getNewestAlbumCoverArt } from '@/utils/artistCover'
import { normalizeSimilarArtists } from '@/service/mappers/artist'

async function getAll() {
  const response = await httpClient<ArtistsResponse>('/getArtists', {
    method: 'GET',
  })

  if (!response) return []

  const artistsList: ISimilarArtist[] = []

  response.data.artists.index.forEach((item) => {
    artistsList.push(...item.artist)
  })

  const normalizedArtists = normalizeSimilarArtists(artistsList)
  const sortedArtists = normalizedArtists.sort((a, b) => a.name.localeCompare(b.name))
  const missingCoverArtists = sortedArtists.filter((artist) => !artist.coverArt)

  if (missingCoverArtists.length === 0) {
    return sortedArtists.map((artist) => ({
      ...artist,
      coverArtType: 'artist' as const,
    }))
  }

  const fallbackCoverByArtistId = new Map<string, string>()

  await Promise.all(
    missingCoverArtists.map(async (artist) => {
      try {
        const fullArtist = await getOne(artist.id)
        const fallbackCover = getNewestAlbumCoverArt(fullArtist?.album)
        if (fallbackCover) {
          fallbackCoverByArtistId.set(artist.id, fallbackCover)
        }
      } catch {
        // Ignore fallback failure for this artist and keep default placeholder behavior.
      }
    }),
  )

  return sortedArtists.map((artist) => {
    const fallbackCover = fallbackCoverByArtistId.get(artist.id)
    return {
      ...artist,
      coverArt: artist.coverArt || fallbackCover || '',
      coverArtType: fallbackCover ? ('album' as const) : ('artist' as const),
    }
  })
}

async function getOne(id: string) {
  const response = await httpClient<ArtistResponse>('/getArtist', {
    method: 'GET',
    query: {
      id,
    },
  })

  return response?.data.artist
}

async function getInfo(id: string) {
  const response = await httpClient<ArtistInfoResponse>('/getArtistInfo', {
    method: 'GET',
    query: {
      id,
    },
  })

  return response?.data.artistInfo
}

export const artists = {
  getOne,
  getInfo,
  getAll,
}
