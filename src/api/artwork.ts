import { getCoverArtUrl, getSimpleCoverArtUrl } from '@/api/httpClient'
import { CoverArt } from '@/types/coverArtType'

type ResolveArtworkOptions = {
  id?: string
  type: CoverArt
  size?: string | number
}

const resolvedArtworkCache = new Map<string, string>()
const inFlightArtworkRequests = new Map<string, Promise<string>>()
const MAX_RESOLVED_ARTWORK_CACHE = 1500

function getArtworkKey(id: string, type: CoverArt, size: string) {
  return `${type}:${size}:${id}`
}

function setResolvedArtworkCache(key: string, value: string) {
  resolvedArtworkCache.set(key, value)
  if (resolvedArtworkCache.size <= MAX_RESOLVED_ARTWORK_CACHE) return

  const oldestKey = resolvedArtworkCache.keys().next().value as
    | string
    | undefined
  if (!oldestKey) return
  resolvedArtworkCache.delete(oldestKey)
}

export async function resolveArtwork({
  id,
  type,
  size = 300,
}: ResolveArtworkOptions) {
  const normalizedSize = size.toString()
  const fallbackUrl = getSimpleCoverArtUrl(undefined, type, normalizedSize)

  if (!id) return fallbackUrl
  if (
    /^(https?:)?\/\//i.test(id) ||
    id.startsWith('data:') ||
    id.startsWith('blob:')
  ) {
    return id
  }

  const key = getArtworkKey(id, type, normalizedSize)
  const cached = resolvedArtworkCache.get(key)
  if (cached) return cached

  const inFlight = inFlightArtworkRequests.get(key)
  if (inFlight) return inFlight

  const request = (async () => {
    try {
      const url = await getCoverArtUrl(id, type, normalizedSize)
      const resolved = url || fallbackUrl
      setResolvedArtworkCache(key, resolved)
      return resolved
    } catch {
      return fallbackUrl
    } finally {
      inFlightArtworkRequests.delete(key)
    }
  })()

  inFlightArtworkRequests.set(key, request)
  return request
}
