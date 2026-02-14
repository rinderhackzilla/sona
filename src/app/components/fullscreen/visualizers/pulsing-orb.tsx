import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function PulsingOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()

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

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const accentColor = accentHSL ? `hsl(${accentHSL})` : 'hsl(240, 100%, 50%)'

      // Calculate average frequency for pulsing
      let sum = 0
      for (let i = 0; i < 64; i++) {
        sum += frequencyData[i] || 0
      }
      const average = sum / 64
      const scale = 0.5 + (average / 255) * 1.5
      const baseRadius = Math.min(width, height) * 0.15
      const radius = baseRadius * scale

      // Draw multiple concentric circles with different opacities
      for (let i = 0; i < 5; i++) {
        const r = radius * (1 + i * 0.3)
        const alpha = 0.6 - i * 0.1

        ctx.globalAlpha = alpha
        ctx.strokeStyle = accentColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw filled center orb with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      
      // Parse HSL and create gradient colors
      gradient.addColorStop(0, accentColor.replace('hsl(', 'hsla(').replace(')', ', 0.8)'))
      gradient.addColorStop(1, accentColor.replace('hsl(', 'hsla(').replace(')', ', 0)'))
      
      ctx.globalAlpha = 1
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', updateSize)
    }
  }, [frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
