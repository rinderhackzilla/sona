import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'

const NEGATIVE_CACHE_TTL_MS = 90_000
const STALE_WHILE_REVALIDATE_MS = 5 * 60 * 1000
const IMAGE_METADATA_STORAGE_KEY = 'sona.image.cache.metadata.v1'
const failedFetches = new Map<string, number>()
const objectUrlCache = new Map<string, string>()
const objectUrlTimestamps = new Map<string, number>()
const cacheMetadata = new Map<string, number>()
const inFlightRequests = new Map<string, Promise<string>>()
const MAX_OBJECT_URL_CACHE_SIZE = 400
const DEFAULT_PREFETCH_STEP_DELAY_MS = 60
const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 15_000
const DEFAULT_MAX_CONCURRENT_IMAGE_FETCHES = 3
let metadataWriteTimer: ReturnType<typeof setTimeout> | null = null
let rateLimitedUntil = 0
let activeImageFetches = 0
let maxConcurrentImageFetches = DEFAULT_MAX_CONCURRENT_IMAGE_FETCHES
let prefetchStepDelayMs = DEFAULT_PREFETCH_STEP_DELAY_MS
const imageFetchQueue: Array<() => void> = []

type NetworkInformationLike = {
  effectiveType?: string
  downlink?: number
  saveData?: boolean
  addEventListener?: (type: 'change', listener: () => void) => void
  removeEventListener?: (type: 'change', listener: () => void) => void
}

function getConnectionInfo(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') return null
  const connection = (
    navigator as Navigator & {
      connection?: NetworkInformationLike
      mozConnection?: NetworkInformationLike
      webkitConnection?: NetworkInformationLike
    }
  ).connection
  return (
    connection ||
    (navigator as Navigator & { mozConnection?: NetworkInformationLike })
      .mozConnection ||
    (navigator as Navigator & { webkitConnection?: NetworkInformationLike })
      .webkitConnection ||
    null
  )
}

function applyAdaptivePrefetchProfile() {
  const connection = getConnectionInfo()
  if (!connection) {
    maxConcurrentImageFetches = DEFAULT_MAX_CONCURRENT_IMAGE_FETCHES
    prefetchStepDelayMs = DEFAULT_PREFETCH_STEP_DELAY_MS
    return
  }

  const effectiveType = (connection.effectiveType ?? '').toLowerCase()
  const downlink = Number(connection.downlink ?? 0)
  const saveData = Boolean(connection.saveData)

  if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
    maxConcurrentImageFetches = 1
    prefetchStepDelayMs = 180
    return
  }

  if (effectiveType === '3g') {
    maxConcurrentImageFetches = 2
    prefetchStepDelayMs = 100
    return
  }

  if (effectiveType === '4g' && downlink >= 10) {
    maxConcurrentImageFetches = 4
    prefetchStepDelayMs = 35
    return
  }

  maxConcurrentImageFetches = DEFAULT_MAX_CONCURRENT_IMAGE_FETCHES
  prefetchStepDelayMs = DEFAULT_PREFETCH_STEP_DELAY_MS
}

function subscribeToNetworkChanges() {
  const connection = getConnectionInfo()
  if (!connection || !connection.addEventListener) return
  connection.addEventListener('change', applyAdaptivePrefetchProfile)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withImageFetchSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeImageFetches >= maxConcurrentImageFetches) {
    await new Promise<void>((resolve) => {
      imageFetchQueue.push(resolve)
    })
  }

  activeImageFetches += 1
  try {
    return await task()
  } finally {
    activeImageFetches = Math.max(0, activeImageFetches - 1)
    const next = imageFetchQueue.shift()
    if (next) next()
  }
}

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
  if (Date.now() < rateLimitedUntil) {
    failedFetches.set(url, now)
    return url
  }

  const networkResponse = await withImageFetchSlot(() =>
    fetch(url, { cache: 'no-store' }),
  )

  if (!networkResponse.ok) {
    if (networkResponse.status === 429) {
      const retryAfterHeader = networkResponse.headers.get('retry-after')
      const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : NaN
      const cooldownMs = Number.isFinite(retryAfterSec)
        ? Math.max(DEFAULT_RATE_LIMIT_COOLDOWN_MS, retryAfterSec * 1000)
        : DEFAULT_RATE_LIMIT_COOLDOWN_MS
      rateLimitedUntil = Date.now() + cooldownMs
    }
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

  const inFlight = inFlightRequests.get(url)
  if (inFlight) {
    return inFlight
  }

  const request = (async () => {
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
    } finally {
      inFlightRequests.delete(url)
    }
  })()

  inFlightRequests.set(url, request)
  return request
}

export async function prefetchCachedImages(urls: string[]) {
  const deduped = [...new Set(urls.filter(Boolean))]
  for (const url of deduped) {
    if (Date.now() < rateLimitedUntil) {
      break
    }
    await getCachedImage(url).catch(() => url)
    await sleep(prefetchStepDelayMs)
  }
}

loadMetadata()
applyAdaptivePrefetchProfile()
subscribeToNetworkChanges()
