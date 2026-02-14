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
      const [h, s, l] = accentHSL.split(' ')

      // Calculate average amplitude
      const sum = frequencyData.reduce((acc, val) => acc + val, 0)
      const average = sum / (frequencyData.length || 1)
      const normalizedAverage = average / 255

      // Base radius and pulse effect
      const baseRadius = Math.min(width, height) * 0.15
      const pulseRadius = baseRadius * (1 + normalizedAverage * 0.8)

      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        pulseRadius * 1.5,
      )

      gradient.addColorStop(0, `hsla(${h}, 100%, 60%, 1)`)
      gradient.addColorStop(0.5, `hsla(${h}, 100%, 50%, 0.8)`)
      gradient.addColorStop(1, `hsla(${h}, 100%, 40%, 0)`)

      // Draw outer glow
      ctx.globalAlpha = 0.3 * normalizedAverage
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Draw main orb
      ctx.globalAlpha = 0.8
      ctx.fillStyle = `hsla(${h}, 100%, 60%, ${0.8 + normalizedAverage * 0.2})`
      ctx.shadowBlur = 40 * normalizedAverage
      ctx.shadowColor = `hsla(${h}, 100%, 60%, ${normalizedAverage})`
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.fill()

      // Draw inner highlight
      ctx.globalAlpha = 0.6
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.beginPath()
      ctx.arc(
        centerX - pulseRadius * 0.3,
        centerY - pulseRadius * 0.3,
        pulseRadius * 0.3,
        0,
        Math.PI * 2,
      )
      ctx.fill()

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

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
