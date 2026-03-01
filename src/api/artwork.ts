import { getCoverArtUrl, getSimpleCoverArtUrl } from '@/api/httpClient'
import { CoverArt } from '@/types/coverArtType'

type ResolveArtworkOptions = {
  id?: string
  type: CoverArt
  size?: string | number
}

export async function resolveArtwork({
  id,
  type,
  size = 300,
}: ResolveArtworkOptions) {
  const normalizedSize = size.toString()
  const fallbackUrl = getSimpleCoverArtUrl(undefined, type, normalizedSize)

  if (!id) return fallbackUrl

  try {
    const url = await getCoverArtUrl(id, type, normalizedSize)
    return url || fallbackUrl
  } catch {
    return fallbackUrl
  }
}
