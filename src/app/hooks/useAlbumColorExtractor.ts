import { useEffect, useRef } from 'react'
import { getSimpleCoverArtUrl } from '@/api/httpClient'
import { usePlayerCurrentSong, useSongColor } from '@/store/player.store'
import { getAlbumColorPalette } from '@/utils/getAlbumColors'

/**
 * Hook that automatically extracts 4 colors from album cover
 * whenever the current song changes.
 */
export function useAlbumColorExtractor() {
  const { coverArt } = usePlayerCurrentSong()
  const { setCurrentSongColorPalette } = useSongColor()
  const lastCoverArtRef = useRef<string | null>(null)

  useEffect(() => {
    // Skip if same cover art
    if (coverArt === lastCoverArtRef.current || !coverArt) {
      return
    }

    lastCoverArtRef.current = coverArt

    const extractColors = async () => {
      try {
        const coverArtUrl = getSimpleCoverArtUrl(coverArt, 'song', '300')
        const img = new Image()
        img.crossOrigin = 'Anonymous'

        img.onload = async () => {
          const palette = await getAlbumColorPalette(img)
          if (palette) {
            setCurrentSongColorPalette(palette)
            console.log('🎨 Album colors extracted:', palette)
          }
        }

        img.onerror = () => {
          console.error('Failed to load album cover for color extraction')
          setCurrentSongColorPalette(null)
        }

        img.src = coverArtUrl
      } catch (error) {
        console.error('Color extraction error:', error)
        setCurrentSongColorPalette(null)
      }
    }

    extractColors()
  }, [coverArt, setCurrentSongColorPalette])
}
