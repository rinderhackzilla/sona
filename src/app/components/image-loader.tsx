import { ReactNode, useEffect, useRef, useState } from 'react'
import { resolveArtwork } from '@/api/artwork'
import { CoverArt } from '@/types/coverArtType'
import { logger } from '@/utils/logger'

interface ImageLoaderProps {
  id?: string
  type: CoverArt
  size?: string | number
  children: (src: string | undefined, isLoading: boolean) => ReactNode
}

export function ImageLoader({
  id,
  type,
  size = 300,
  children,
}: ImageLoaderProps) {
  const isDev = import.meta.env.DEV
  const [src, setSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const startedAt = performance.now()

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsLoading(true)

    if (!id) {
      resolveArtwork({ id, type, size }).then((url) => {
        if (isDev) {
          logger.info('[CoverDebug] Resolved fallback artwork', {
            id,
            type,
            size,
            elapsedMs: Math.round(performance.now() - startedAt),
            resolvedUrl: url,
          })
        }
        if (isDev && type === 'artist') {
          console.info('[ImageLoader][artist] fallback', {
            id,
            type,
            size,
            resolvedUrl: url,
          })
        }
        setSrc(url)
        setIsLoading(false)
      })
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchImage = async () => {
      try {
        if (isDev) {
          logger.info('[CoverDebug] Resolving artwork started', {
            id,
            type,
            size,
          })
        }
        const finalUrl = await resolveArtwork({ id, type, size })

        if (!abortController.signal.aborted) {
          if (isDev) {
            logger.info('[CoverDebug] Resolved artwork', {
              id,
              type,
              size,
              elapsedMs: Math.round(performance.now() - startedAt),
              resolvedUrl: finalUrl,
            })
          }
          if (isDev && type === 'artist') {
            console.info('[ImageLoader][artist] resolved', {
              id,
              type,
              size,
              resolvedUrl: finalUrl,
            })
          }
          setSrc(finalUrl)
          setIsLoading(false)
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          if (isDev) {
            logger.info('[CoverDebug] Resolve artwork failed, using fallback', {
              id,
              type,
              size,
              elapsedMs: Math.round(performance.now() - startedAt),
            })
          }
          console.error('Error fetching image:', error)
          const fallback = await resolveArtwork({ type, size })
          if (isDev && type === 'artist') {
            console.info('[ImageLoader][artist] error-fallback', {
              id,
              type,
              size,
              fallbackUrl: fallback,
              error,
            })
          }
          setSrc(fallback)
          setIsLoading(false)
        }
      }
    }

    fetchImage()

    return () => {
      abortController.abort()
    }
  }, [id, type, size])

  return <>{children(src, isLoading)}</>
}
