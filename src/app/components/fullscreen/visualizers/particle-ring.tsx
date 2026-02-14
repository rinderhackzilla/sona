import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

interface Particle {
  angle: number
  radius: number
  size: number
  speed: number
  alpha: number
}

export function ParticleRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
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
          speed: 0.01 + Math.random() * 0.02,
          alpha: 0.5 + Math.random() * 0.5,
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

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Calculate average amplitude for ring size
      const sum = frequencyData.reduce((acc, val) => acc + val, 0)
      const average = sum / (frequencyData.length || 1)
      const normalizedAverage = average / 255

      const baseRadius = Math.min(width, height) * 0.25
      const ringRadius = baseRadius * (1 + normalizedAverage * 0.5)

      // Draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update particle angle
        particle.angle += particle.speed

        // Get frequency for this particle
        const dataIndex = Math.floor(
          (index / particleCount) * frequencyData.length,
        )
        const frequency = (frequencyData[dataIndex] || 0) / 255

        // Calculate position
        const particleRadius = ringRadius + frequency * 100
        const x = centerX + Math.cos(particle.angle) * particleRadius
        const y = centerY + Math.sin(particle.angle) * particleRadius

        // Draw particle
        const hueShift = index % 2 === 0 ? 0 : 30
        ctx.fillStyle = `hsla(${Number.parseInt(h) + hueShift}, 100%, 60%, ${particle.alpha * (0.5 + frequency * 0.5)})`
        ctx.globalAlpha = particle.alpha * (0.5 + frequency * 0.5)
        ctx.shadowBlur = 8 * frequency
        ctx.shadowColor = `hsla(${Number.parseInt(h) + hueShift}, 100%, 60%, ${frequency})`
        ctx.beginPath()
        ctx.arc(x, y, particle.size * (1 + frequency), 0, Math.PI * 2)
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
  }, [frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
