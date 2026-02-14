import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  freq: number
}

export function ParticleNebula() {
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

    let animationId: number

    const draw = () => {
      if (!ctx || !canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerX = width / 2
      const centerY = height / 2

      // Fade previous frame for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Get average frequency for particle generation
      const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const intensity = avgFreq / 255

      // Spawn new particles based on audio intensity
      const spawnCount = Math.floor(intensity * 8)
      for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * 30
        const freq = Math.floor(Math.random() * frequencyData.length)
        
        particlesRef.current.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          freq: freq,
        })
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        // Update position
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.008

        if (p.life <= 0) return false

        // Get frequency value for this particle
        const freqValue = (frequencyData[p.freq] || 0) / 255
        const size = 2 + freqValue * 4

        // Color based on frequency range
        let hue = parseFloat(h)
        if (p.freq < 20) {
          hue = (hue + 180) % 360 // Bass = complementary color
        } else if (p.freq > 60) {
          hue = (hue + 90) % 360 // Highs = different hue
        }

        // Draw particle with glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue}, 100%, ${60 + freqValue * 20}%, ${p.life * freqValue})`
        ctx.shadowBlur = 15 * freqValue
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${freqValue})`
        ctx.fill()

        return true
      })

      // Limit particle count
      if (particlesRef.current.length > 500) {
        particlesRef.current = particlesRef.current.slice(-500)
      }

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
