import { useEffect, useRef } from 'react'
import { getCoverArtUrl } from '@/api/httpClient'
import type { Song } from '@/types/responses/song'

interface CoverMosaicProps {
  songs: Song[]
  size?: number
}

export function CoverMosaic({ songs, size = 700 }: CoverMosaicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || songs.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = size
    canvas.height = size

    // Determine grid: 2x2 for 4 covers, 3x3 for 9 covers
    const gridSize = songs.length >= 9 ? 3 : 2
    const coverSize = size / gridSize
    const totalCovers = gridSize * gridSize

    // Select unique covers
    const uniqueCovers = [...new Set(songs.slice(0, totalCovers).map(s => s.coverArt))]
      .filter(Boolean)
      .slice(0, totalCovers)

    let loadedImages = 0

    // Load and draw all images
    uniqueCovers.forEach((coverArt, index) => {
      if (!coverArt) return

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const row = Math.floor(index / gridSize)
        const col = index % gridSize
        const x = col * coverSize
        const y = row * coverSize

        ctx.drawImage(img, x, y, coverSize, coverSize)

        loadedImages++
        
        // Apply gradient overlay after all images loaded
        if (loadedImages === uniqueCovers.length) {
          applyGradientOverlay(ctx, size)
        }
      }

      img.onerror = () => {
        // Draw placeholder on error
        const row = Math.floor(index / gridSize)
        const col = index % gridSize
        const x = col * coverSize
        const y = row * coverSize
        
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(x, y, coverSize, coverSize)
        
        loadedImages++
        if (loadedImages === uniqueCovers.length) {
          applyGradientOverlay(ctx, size)
        }
      }

      img.src = getCoverArtUrl(coverArt, '300')
    })
  }, [songs, size])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-cover rounded-lg"
      style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
    />
  )
}

function applyGradientOverlay(ctx: CanvasRenderingContext2D, size: number) {
  // Create gradient overlay (purple/blue theme)
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)') // violet-500
  gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)') // indigo-500
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)') // blue-500

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Add subtle vignette effect
  const vignette = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.3,
    size / 2, size / 2, size * 0.8
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
  
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, size, size)
}
