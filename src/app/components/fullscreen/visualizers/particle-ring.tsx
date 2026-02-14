import { useEffect, useRef } from 'react'
import { useVisualizerSettings } from '../settings'

interface Particle {
  angle: number
  radius: number
  size: number
  speed: number
  alpha: number
}

interface ParticleRingProps {
  audioData: Uint8Array
  isPlaying: boolean
}

export function ParticleRing({ audioData, isPlaying }: ParticleRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
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

    // Initialize particles
    const particleCount = 100
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          angle: (Math.PI * 2 * i) / particleCount,
          radius: Math.min(width, height) * 0.3,
          size: 2 + Math.random() * 3,
          speed: 0.01 + Math.random() * 0.02,
          alpha: 0.5 + Math.random() * 0.5,
        })
      }
    }

    let animationId: number

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      if (!isPlaying) {
        animationId = requestAnimationFrame(draw)
        return
      }

      // Calculate average amplitude for ring size
      const sum = audioData.reduce((acc, val) => acc + val, 0)
      const average = sum / audioData.length
      const normalizedAverage = average / 255

      const baseRadius = Math.min(width, height) * 0.25
      const ringRadius = baseRadius * (1 + normalizedAverage * 0.5)

      // Draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update particle angle
        particle.angle += particle.speed

        // Get frequency for this particle
        const dataIndex = Math.floor(
          (index / particleCount) * audioData.length,
        )
        const frequency = audioData[dataIndex] / 255

        // Calculate position
        const particleRadius = ringRadius + frequency * 100
        const x = centerX + Math.cos(particle.angle) * particleRadius
        const y = centerY + Math.sin(particle.angle) * particleRadius

        // Draw particle
        const color = index % 2 === 0 ? primaryColor : secondaryColor
        ctx.fillStyle = color || '#3b82f6'
        ctx.globalAlpha = particle.alpha * (0.5 + frequency * 0.5)
        ctx.beginPath()
        ctx.arc(x, y, particle.size * (1 + frequency), 0, Math.PI * 2)
        ctx.fill()
      })

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
