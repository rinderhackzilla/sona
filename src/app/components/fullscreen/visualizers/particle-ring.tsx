import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'
import { useSongColor } from '@/store/player.store'

interface Particle {
  angle: number
  radius: number
  size: number
  speed: number
  alpha: number
  colorIndex: number // Which color from palette to use
}

export function ParticleRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
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

    // Initialize particles
    const particleCount = 100
    if (particlesRef.current.length === 0) {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          angle: (Math.PI * 2 * i) / particleCount,
          radius: Math.min(width, height) * 0.3,
          size: 2 + Math.random() * 3,
          speed: (0.01 + Math.random() * 0.02) * 0.75, // 25% slower
          alpha: 0.5 + Math.random() * 0.5,
          colorIndex: i % 4, // Cycle through 4 colors
        })
      }
    }

    let animationId: number

    const draw = () => {
      if (!ctx || !canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerX = width / 2
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      // Use palette colors if available, fallback to accent
      const colors = currentSongColorPalette
        ? [
            currentSongColorPalette.vibrant,
            currentSongColorPalette.dominant,
            currentSongColorPalette.accent,
            currentSongColorPalette.muted,
          ]
        : [
            getComputedStyle(document.documentElement)
              .getPropertyValue('--accent')
              .trim(),
          ]

      // Calculate average amplitude for ring size
      const sum = frequencyData.reduce((acc, val) => acc + val, 0)
      const average = sum / (frequencyData.length || 1)
      const normalizedAverage = average / 255

      // Smaller inner radius, same outer reach
      const baseRadius = Math.min(width, height) * 0.18 // reduced from 0.25
      const ringRadius = baseRadius * (1 + normalizedAverage * 0.5)

      // Draw particles with palette colors
      particlesRef.current.forEach((particle, index) => {
        // Update particle angle
        particle.angle += particle.speed

        // Get frequency for this particle
        const dataIndex = Math.floor(
          (index / particleCount) * frequencyData.length,
        )
        const frequency = (frequencyData[dataIndex] || 0) / 255

        // Enhanced contrast: square the frequency value for more dramatic difference
        const enhancedFrequency = frequency * frequency

        // Calculate position with same outer amplitude but smaller inner radius
        const particleRadius = ringRadius + enhancedFrequency * 150
        const x = centerX + Math.cos(particle.angle) * particleRadius
        const y = centerY + Math.sin(particle.angle) * particleRadius

        // Increased base opacity and size
        const baseOpacity = 0.6
        const opacity = baseOpacity + enhancedFrequency * 0.4

        // Get color from palette (cycles through all 4)
        const colorHex =
          colors.length > 1
            ? colors[particle.colorIndex]
            : colors[0]

        // Convert hex to rgba
        const hexToRgba = (hex: string, alpha: number) => {
          if (hex.startsWith('hsl')) {
            // Already HSL format from CSS variable
            const [h, s, l] = hex.split(' ')
            return `hsla(${h}, ${s}, ${l}, ${alpha})`
          }
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        // Draw particle
        ctx.fillStyle = hexToRgba(colorHex, opacity)
        ctx.globalAlpha = opacity
        ctx.shadowBlur = 15 * enhancedFrequency
        ctx.shadowColor = hexToRgba(colorHex, enhancedFrequency)
        ctx.beginPath()
        ctx.arc(
          x,
          y,
          particle.size * (1 + enhancedFrequency * 1.5),
          0,
          Math.PI * 2,
        )
        ctx.fill()
      })

      ctx.globalAlpha = 1
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
