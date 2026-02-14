import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

interface Particle {
  angle: number
  baseRadius: number
  size: number
}

export function ParticleRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()
  const particlesRef = useRef<Particle[]>([])

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
    if (particlesRef.current.length === 0) {
      const particleCount = 128
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          angle: (i / particleCount) * Math.PI * 2,
          baseRadius: Math.random() * 50 + 150,
          size: Math.random() * 3 + 2,
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

      const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()

      // Draw particles
      particlesRef.current.forEach((particle, index) => {
        const dataIndex = Math.floor((index / particlesRef.current.length) * frequencyData.length)
        const value = frequencyData[dataIndex] || 0
        const radiusOffset = (value / 255) * 100
        const radius = particle.baseRadius + radiusOffset

        const x = centerX + Math.cos(particle.angle) * radius
        const y = centerY + Math.sin(particle.angle) * radius

        const alpha = 0.3 + (value / 255) * 0.7
        ctx.globalAlpha = alpha
        ctx.fillStyle = `hsl(${accentColor})`
        ctx.beginPath()
        ctx.arc(x, y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Slowly rotate particles
        particle.angle += 0.001
      })

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
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}
