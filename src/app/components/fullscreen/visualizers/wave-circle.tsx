import { useEffect, useRef } from 'react'
import { useVisualizerSettings } from '../settings'

interface WaveCircleProps {
  audioData: Uint8Array
  isPlaying: boolean
}

export function WaveCircle({ audioData, isPlaying }: WaveCircleProps) {
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

      const baseRadius = Math.min(width, height) * 0.25
      const points = 128

      // Draw multiple wave circles
      const numCircles = 3
      for (let circle = 0; circle < numCircles; circle++) {
        ctx.beginPath()

        const circleRadius = baseRadius * (1 + circle * 0.3)
        const color = circle % 2 === 0 ? primaryColor : secondaryColor

        for (let i = 0; i <= points; i++) {
          const angle = (Math.PI * 2 * i) / points
          const dataIndex = Math.floor((i / points) * audioData.length)
          const amplitude = audioData[dataIndex] / 255

          const radius = circleRadius + amplitude * 80 * (1 - circle * 0.2)
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        ctx.strokeStyle = color || '#3b82f6'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7 - circle * 0.2
        ctx.stroke()
      }

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
