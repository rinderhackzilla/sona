import { ReactNode, useEffect, useRef, useState } from 'react'
import { resolveArtwork } from '@/api/artwork'
import { CoverArt } from '@/types/coverArtType'

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
  const [src, setSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const requestId = ++requestIdRef.current

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsLoading(true)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const isRequestActive = () =>
      !abortController.signal.aborted && requestIdRef.current === requestId

    const fetchImage = async () => {
      try {
        const resolvedUrl = await resolveArtwork({ id, type, size })
        const finalUrl =
          resolvedUrl && resolvedUrl.trim().length > 0
            ? resolvedUrl
            : await resolveArtwork({ type, size })

        if (isRequestActive()) {
          setSrc(finalUrl)
        }
      } catch (_error) {
        if (isRequestActive()) {
          const fallback = await resolveArtwork({ type, size })
          if (isRequestActive()) {
            setSrc(fallback)
          }
        }
      } finally {
        if (isRequestActive()) {
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
