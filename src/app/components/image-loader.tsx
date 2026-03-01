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

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsLoading(true)
    setSrc('')

    if (!id) {
      resolveArtwork({ id, type, size }).then((url) => setSrc(url))
      setIsLoading(false)
      return
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchImage = async () => {
      try {
        const finalUrl = await resolveArtwork({ id, type, size })

        if (!abortController.signal.aborted) {
          setSrc(finalUrl)
          setIsLoading(false)
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching image:', error)
          const fallback = await resolveArtwork({ type, size })
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
