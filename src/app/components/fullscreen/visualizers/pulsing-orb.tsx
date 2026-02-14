import { useEffect, useRef } from 'react'
import { useVisualizerSettings } from '../settings'

interface PulsingOrbProps {
  audioData: Uint8Array
  isPlaying: boolean
}

export function PulsingOrb({ audioData, isPlaying }: PulsingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { primaryColor, secondaryColor } = useVisualizerSettings()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    let animationId: number

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      if (!isPlaying) {
        animationId = requestAnimationFrame(draw)
        return
      }

      // Calculate average amplitude
      const sum = audioData.reduce((acc, val) => acc + val, 0)
      const average = sum / audioData.length
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

      // Parse colors
      const primary = primaryColor || '#3b82f6'
      const secondary = secondaryColor || '#8b5cf6'

      gradient.addColorStop(0, primary)
      gradient.addColorStop(0.5, secondary)
      gradient.addColorStop(1, 'transparent')

      // Draw outer glow
      ctx.globalAlpha = 0.3 * normalizedAverage
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Draw main orb
      ctx.globalAlpha = 0.8
      ctx.fillStyle = primary
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.fill()

      // Draw inner highlight
      ctx.globalAlpha = 0.6
      ctx.fillStyle = 'white'
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

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [audioData, isPlaying, primaryColor, secondaryColor])

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      className="w-full h-full"
    />
  )
}
