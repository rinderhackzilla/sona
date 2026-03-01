import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'

const NEGATIVE_CACHE_TTL_MS = 90_000
const STALE_WHILE_REVALIDATE_MS = 5 * 60 * 1000
const IMAGE_METADATA_STORAGE_KEY = 'sona.image.cache.metadata.v1'
const failedFetches = new Map<string, number>()
const objectUrlCache = new Map<string, string>()
const objectUrlTimestamps = new Map<string, number>()
const cacheMetadata = new Map<string, number>()
const MAX_OBJECT_URL_CACHE_SIZE = 400
let metadataWriteTimer: ReturnType<typeof setTimeout> | null = null

function loadMetadata() {
  try {
    const raw = safeStorageGet(IMAGE_METADATA_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, number>
    Object.entries(parsed).forEach(([key, value]) => {
      if (Number.isFinite(value)) cacheMetadata.set(key, value)
    })
  } catch {
    // Ignore invalid storage payload
  }
}

function scheduleMetadataPersist() {
  if (metadataWriteTimer) return
  metadataWriteTimer = setTimeout(() => {
    metadataWriteTimer = null
    try {
      const payload = Object.fromEntries(cacheMetadata.entries())
      safeStorageSet(IMAGE_METADATA_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage errors
    }
  }, 200)
}

function getImageIdentityKey(url: string) {
  try {
    const parsed = new URL(url, window.location.origin)
    if (!parsed.pathname.includes('/rest/getCoverArt')) return parsed.toString()
    const id = parsed.searchParams.get('id') ?? ''
    const size = parsed.searchParams.get('size') ?? '300'
    if (!id) return parsed.toString()
    return `cover:${id}:${size}`
  } catch {
    return url
  }
}

function setObjectUrl(url: string, objectUrl: string) {
  const key = getImageIdentityKey(url)
  const existing = objectUrlCache.get(key)
  if (existing && existing !== objectUrl) {
    URL.revokeObjectURL(existing)
  }
  objectUrlCache.set(key, objectUrl)
  const fetchedAt = Date.now()
  objectUrlTimestamps.set(key, fetchedAt)
  cacheMetadata.set(key, fetchedAt)
  scheduleMetadataPersist()

  if (objectUrlCache.size <= MAX_OBJECT_URL_CACHE_SIZE) return
  const oldestKey = objectUrlCache.keys().next().value as string | undefined
  if (!oldestKey) return
  const oldest = objectUrlCache.get(oldestKey)
  if (oldest) URL.revokeObjectURL(oldest)
  objectUrlCache.delete(oldestKey)
  objectUrlTimestamps.delete(oldestKey)
}

async function fetchAndCacheImage(url: string, cache: Cache, now: number) {
  const networkResponse = await fetch(url, { cache: 'no-store' })

  if (!networkResponse.ok) {
    failedFetches.set(url, now)
    return url
  }

  const contentType = networkResponse.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    failedFetches.set(url, now)
    return url
  }

  await cache.put(url, networkResponse.clone())
  const blob = await networkResponse.blob()
  failedFetches.delete(url)
  const objectUrl = URL.createObjectURL(blob)
  setObjectUrl(url, objectUrl)
  return objectUrl
}

export async function getCachedImage(url: string): Promise<string> {
  const now = Date.now()
  const failedAt = failedFetches.get(url)
  if (failedAt && now - failedAt < NEGATIVE_CACHE_TTL_MS) {
    return url
  }

  const key = getImageIdentityKey(url)
  const persistedFetchedAt = cacheMetadata.get(key) ?? 0
  const cachedObjectUrl = objectUrlCache.get(key)
  const cachedObjectUrlTs = objectUrlTimestamps.get(key) ?? 0
  if (cachedObjectUrl) {
    const staleBy = Math.max(cachedObjectUrlTs, persistedFetchedAt)
    if (now - staleBy > STALE_WHILE_REVALIDATE_MS) {
      caches
        .open('images')
        .then((cache) => fetchAndCacheImage(url, cache, Date.now()))
        .catch(() => undefined)
    }
    return cachedObjectUrl
  }

  try {
    const cache = await caches.open('images')

    const cachedResponse = await cache.match(url)

    if (cachedResponse) {
      const blob = await cachedResponse.blob()
      const isImage = blob.type.startsWith('image/')
      const hasContent = blob.size > 0

      if (isImage && hasContent) {
        const objectUrl = URL.createObjectURL(blob)
        setObjectUrl(url, objectUrl)
        const staleBy = cacheMetadata.get(key) ?? now
        if (now - staleBy > STALE_WHILE_REVALIDATE_MS) {
          fetchAndCacheImage(url, cache, now).catch(() => undefined)
        }
        return objectUrl
      }

      await cache.delete(url)
    }
    return await fetchAndCacheImage(url, cache, now)
  } catch (error) {
    console.error('Error fetching image:', error)
    failedFetches.set(url, now)

    return url
  }
}

export async function prefetchCachedImages(urls: string[]) {
  const deduped = [...new Set(urls.filter(Boolean))]
  await Promise.all(deduped.map((url) => getCachedImage(url).catch(() => url)))
}

loadMetadata()
