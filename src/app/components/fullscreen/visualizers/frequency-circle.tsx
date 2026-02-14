import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'
import { useSongColor } from '@/store/player.store'

export function FrequencyCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()
  const { currentSongColorPalette } = useSongColor()

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
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * 0.28

      ctx.clearRect(0, 0, width, height)

      // Get colors from palette or fallback
      const colors = currentSongColorPalette
        ? [
            currentSongColorPalette.vibrant,
            currentSongColorPalette.accent,
            currentSongColorPalette.dominant,
            currentSongColorPalette.muted,
          ]
        : null

      const getFallbackColor = () => {
        const accentHSL = getComputedStyle(document.documentElement)
          .getPropertyValue('--accent')
          .trim()
        return accentHSL
      }

      const barCount = Math.min(frequencyData.length, 64)
      const angleStep = (Math.PI * 2) / barCount

      // Draw bars with cycling colors
      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep - Math.PI / 2

        const frequencyValue = frequencyData[i] || 0
        let normalizedValue = frequencyValue / 255

        // 10% bass boost
        if (i < 16) {
          normalizedValue = Math.min(1, normalizedValue * 1.1)
        }

        const barHeight = normalizedValue * radius * 0.65

        const x1 = centerX + Math.cos(angle) * radius
        const y1 = centerY + Math.sin(angle) * radius
        const x2 = centerX + Math.cos(angle) * (radius + barHeight)
        const y2 = centerY + Math.sin(angle) * (radius + barHeight)

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2)

        if (colors) {
          // Cycle through palette colors
          const colorIndex = Math.floor((i / barCount) * 4)
          const hex = colors[colorIndex]
          gradient.addColorStop(0, hexToRgba(hex, 0.5))
          gradient.addColorStop(1, hexToRgba(hex, normalizedValue))
          ctx.shadowColor = hexToRgba(hex, normalizedValue * 0.8)
        } else {
          const [h] = getFallbackColor().split(' ')
          gradient.addColorStop(0, `hsla(${h}, 100%, 50%, 0.5)`)
          gradient.addColorStop(1, `hsla(${h}, 100%, 70%, ${normalizedValue})`)
          ctx.shadowColor = `hsla(${h}, 100%, 60%, ${normalizedValue * 0.8})`
        }

        ctx.shadowBlur = 12 * normalizedValue
        ctx.strokeStyle = gradient
        ctx.lineWidth = (width / barCount) * 0.8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      ctx.shadowBlur = 0

      // Circle outline with vibrant color
      if (colors) {
        ctx.strokeStyle = hexToRgba(colors[0], 0.7)
      } else {
        const [h] = getFallbackColor().split(' ')
        ctx.strokeStyle = `hsla(${h}, 100%, 60%, 0.7)`
      }
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()

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
