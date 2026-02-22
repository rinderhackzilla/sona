export async function getCachedImage(url: string): Promise<string> {
  try {
    const cache = await caches.open('images')

    const cachedResponse = await cache.match(url)

    if (cachedResponse) {
      const blob = await cachedResponse.blob()
      const isImage = blob.type.startsWith('image/')
      const hasContent = blob.size > 0

      if (isImage && hasContent) {
        return URL.createObjectURL(blob)
      }

      await cache.delete(url)
    }

    const networkResponse = await fetch(url, { cache: 'no-store' })

    if (!networkResponse.ok) {
      return url
    }

    const contentType = networkResponse.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return url
    }

    await cache.put(url, networkResponse.clone())
    const blob = await networkResponse.blob()

    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error fetching image:', error)

    return url
  }
}
