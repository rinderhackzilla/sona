import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'
import { useSongColor } from '@/store/player.store'

export function RadialSpectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()
  const { currentSongColorPalette } = useSongColor()
  const rotationRef = useRef(0)

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
      const maxRadius = Math.min(width, height) * 0.35

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

      rotationRef.current += 0.003

      const barCount = Math.min(frequencyData.length, 80)
      const angleStep = (Math.PI * 2) / barCount

      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep + rotationRef.current

        const frequencyValue = frequencyData[i] || 0
        let normalizedValue = frequencyValue / 255

        // 10% bass boost
        if (i < 16) {
          normalizedValue = Math.min(1, normalizedValue * 1.1)
        }

        const barLength = normalizedValue * maxRadius * 0.75

        const x1 = centerX + Math.cos(angle) * 30
        const y1 = centerY + Math.sin(angle) * 30
        const x2 = centerX + Math.cos(angle) * (30 + barLength)
        const y2 = centerY + Math.sin(angle) * (30 + barLength)

        // Create gradient with 4 colors cycling through bars
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2)

        if (colors) {
          // Use palette colors - cycle through based on bar index
          const colorIndex = i % 4
          const nextColorIndex = (i + 1) % 4
          const hex = colors[colorIndex]
          const nextHex = colors[nextColorIndex]

          gradient.addColorStop(0, hexToRgba(hex, 0.4))
          gradient.addColorStop(0.5, hexToRgba(hex, 0.8 * normalizedValue))
          gradient.addColorStop(1, hexToRgba(nextHex, normalizedValue))

          ctx.shadowColor = hexToRgba(hex, normalizedValue)
        } else {
          // Fallback to accent
          const [h, s, l] = getFallbackColor().split(' ')
          gradient.addColorStop(0, `hsla(${h}, ${s}, ${l}, 0.4)`)
          gradient.addColorStop(
            0.5,
            `hsla(${h}, 100%, 60%, ${0.8 * normalizedValue})`,
          )
          gradient.addColorStop(1, `hsla(${h}, 100%, 70%, ${normalizedValue})`)
          ctx.shadowColor = `hsla(${h}, 100%, 60%, ${normalizedValue})`
        }

        ctx.shadowBlur = 15 * normalizedValue
        ctx.strokeStyle = gradient
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      ctx.shadowBlur = 0

      // Central pulsing core with palette colors
      const avgFrequency =
        frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const pulseScale = 1 + (avgFrequency / 255) * 0.6

      for (let i = 0; i < 3; i++) {
        if (colors) {
          const coreColor = colors[i % 4]
          ctx.strokeStyle = hexToRgba(coreColor, 0.6 - i * 0.15)
        } else {
          const [h] = getFallbackColor().split(' ')
          ctx.strokeStyle = `hsla(${h}, 100%, ${60 + i * 10}%, ${0.6 - i * 0.15})`
        }
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, 25 * pulseScale + i * 5, 0, Math.PI * 2)
        ctx.stroke()
      }

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
