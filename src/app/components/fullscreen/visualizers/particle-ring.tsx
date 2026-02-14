import { useEffect, useRef } from 'react'

interface Particle {
  angle: number
  distance: number
  speed: number
  size: number
  phase: number
}

export function ParticleRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
      const particleCount = 150
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          angle: (i / particleCount) * Math.PI * 2,
          distance: 100 + Math.random() * 100,
          speed: 0.01 + Math.random() * 0.02,
          size: 2 + Math.random() * 3,
          phase: Math.random() * Math.PI * 2,
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
      const time = Date.now() / 1000

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Draw connecting lines between nearby particles
      ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, 0.1)`
      ctx.lineWidth = 1
      
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p1 = particlesRef.current[i]
        const wave1 = Math.sin(time * 2 + p1.phase) * 30
        const r1 = p1.distance + wave1
        const x1 = centerX + Math.cos(p1.angle) * r1
        const y1 = centerY + Math.sin(p1.angle) * r1

        for (let j = i + 1; j < Math.min(i + 5, particlesRef.current.length); j++) {
          const p2 = particlesRef.current[j]
          const wave2 = Math.sin(time * 2 + p2.phase) * 30
          const r2 = p2.distance + wave2
          const x2 = centerX + Math.cos(p2.angle) * r2
          const y2 = centerY + Math.sin(p2.angle) * r2

          const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          if (dist < 80) {
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      particlesRef.current.forEach((particle) => {
        const wave = Math.sin(time * 2 + particle.phase) * 30
        const radius = particle.distance + wave

        const x = centerX + Math.cos(particle.angle) * radius
        const y = centerY + Math.sin(particle.angle) * radius

        const pulse = Math.sin(time * 4 + particle.phase) * 0.5 + 0.5
        const alpha = 0.4 + pulse * 0.6
        
        ctx.fillStyle = `hsla(${h}, ${s}, ${l}, ${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Rotate particles
        particle.angle += particle.speed
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
