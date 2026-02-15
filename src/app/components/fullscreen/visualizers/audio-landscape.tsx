import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'
import { useSongColor } from '@/store/player.store'

export function AudioLandscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()
  const { currentSongColorPalette } = useSongColor()
  const offsetRef = useRef(0)
  const historyRef = useRef<number[][]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    let animationId: number

    const draw = () => {
      if (!ctx || !canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      // Full canvas vertical gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
      
      if (currentSongColorPalette) {
        // Gradient from top (dominant) to bottom (muted)
        bgGradient.addColorStop(0, hexToRgba(currentSongColorPalette.dominant, 0.15))
        bgGradient.addColorStop(0.5, hexToRgba(currentSongColorPalette.vibrant, 0.1))
        bgGradient.addColorStop(1, hexToRgba(currentSongColorPalette.muted, 0.2))
      } else {
        const accentHSL = getComputedStyle(document.documentElement)
          .getPropertyValue('--accent')
          .trim()
        const [h] = accentHSL.split(' ')
        bgGradient.addColorStop(0, `hsla(${h}, 100%, 20%, 0.1)`)
        bgGradient.addColorStop(1, `hsla(${h}, 100%, 10%, 0.2)`)
      }

      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Get colors from palette or fallback
      const color1 = currentSongColorPalette
        ? currentSongColorPalette.vibrant
        : null
      const color2 = currentSongColorPalette
        ? currentSongColorPalette.accent
        : null

      const getFallbackColor = () => {
        const accentHSL = getComputedStyle(document.documentElement)
          .getPropertyValue('--accent')
          .trim()
        return accentHSL
      }

      // Add current frequency snapshot to history
      const snapshot = Array.from(frequencyData.slice(0, 64))
      historyRef.current.unshift(snapshot)

      // Keep only last 60 frames
      if (historyRef.current.length > 60) {
        historyRef.current = historyRef.current.slice(0, 60)
      }

      // Scroll offset
      offsetRef.current += 2
      if (offsetRef.current > height / 60) {
        offsetRef.current = 0
      }

      // Draw landscape from back to front for 3D effect
      for (let row = historyRef.current.length - 1; row >= 0; row--) {
        const rowData = historyRef.current[row]
        if (!rowData) continue

        const progress = row / historyRef.current.length
        const y = height * 0.8 - progress * height * 0.5 + offsetRef.current
        const scale = 0.5 + progress * 0.5 // Perspective scaling

        ctx.beginPath()
        const barCount = rowData.length
        const barWidth = (width * scale) / barCount
        const startX = (width - width * scale) / 2

        for (let i = 0; i < barCount; i++) {
          const freqValue = rowData[i] || 0
          const normalizedValue = freqValue / 255
          const barHeight = normalizedValue * 150 * scale

          const x = startX + i * barWidth
          const barY = y - barHeight

          if (i === 0) {
            ctx.moveTo(x, y)
            ctx.lineTo(x, barY)
          } else {
            ctx.lineTo(x, barY)
          }
        }

        // Complete the shape
        ctx.lineTo(startX + barCount * barWidth, y)
        ctx.lineTo(startX, y)
        ctx.closePath()

        // Gradient fill with palette colors
        const gradient = ctx.createLinearGradient(0, y, 0, y - 150 * scale)
        if (color1 && color2) {
          gradient.addColorStop(0, hexToRgba(color1, 0.3 * progress))
          gradient.addColorStop(1, hexToRgba(color2, 0.7 * progress))
          ctx.strokeStyle = hexToRgba(color2, 0.6 + progress * 0.4)
          ctx.shadowColor = hexToRgba(color2, progress * 0.5)
        } else {
          const [h] = getFallbackColor().split(' ')
          gradient.addColorStop(0, `hsla(${h}, 100%, 30%, ${0.3 * progress})`)
          gradient.addColorStop(1, `hsla(${h}, 100%, 60%, ${0.7 * progress})`)
          ctx.strokeStyle = `hsla(${h}, 100%, ${60 + progress * 20}%, ${0.6 + progress * 0.4})`
          ctx.shadowColor = `hsla(${h}, 100%, 60%, ${progress * 0.5})`
        }

        ctx.fillStyle = gradient
        ctx.fill()

        // Wireframe on top
        ctx.lineWidth = 1 + progress * 1.5
        ctx.shadowBlur = 8 * progress
        ctx.stroke()
      }

      ctx.shadowBlur = 0

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', updateSize)
    }
  }, [frequencyData, currentSongColorPalette])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}

// Helper function
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
