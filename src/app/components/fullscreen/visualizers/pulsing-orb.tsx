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
    let phase = 0

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

      // Calculate bass (low frequencies) and treble (high frequencies)
      const bassData = frequencyData.slice(0, 8)
      const midData = frequencyData.slice(8, 32)
      const trebleData = frequencyData.slice(32, 64)

      const bass = bassData.reduce((a, b) => a + b, 0) / (bassData.length * 255)
      const mid = midData.reduce((a, b) => a + b, 0) / (midData.length * 255)
      const treble = trebleData.reduce((a, b) => a + b, 0) / (trebleData.length * 255)

      const baseRadius = Math.min(width, height) * 0.2
      const bassRadius = baseRadius * (1 + bass * 1.2)
      const midRadius = baseRadius * (1 + mid * 0.8)
      const trebleRadius = baseRadius * (1 + treble * 0.5)

      phase += 0.02

      // Outer pulsing glow rings
      for (let i = 0; i < 3; i++) {
        const ringPhase = phase + i * 0.8
        const ringAlpha = (Math.sin(ringPhase) * 0.5 + 0.5) * bass * 0.4
        const ringRadius = bassRadius * (1.5 + i * 0.3) + Math.sin(phase + i) * 20

        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          ringRadius * 0.8,
          centerX,
          centerY,
          ringRadius,
        )
        gradient.addColorStop(0, `hsla(${h}, 100%, 60%, ${ringAlpha})`)
        gradient.addColorStop(1, `hsla(${h}, 100%, 40%, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Main orb with bass response
      const orbGradient = ctx.createRadialGradient(
        centerX - bassRadius * 0.3,
        centerY - bassRadius * 0.3,
        0,
        centerX,
        centerY,
        bassRadius,
      )
      orbGradient.addColorStop(0, `hsla(${h}, 100%, 80%, 1)`)
      orbGradient.addColorStop(0.3, `hsla(${h}, 100%, 65%, 0.95)`)
      orbGradient.addColorStop(0.7, `hsla(${h}, 100%, 50%, 0.9)`)
      orbGradient.addColorStop(1, `hsla(${h}, 100%, 35%, 0.8)`)

      ctx.shadowBlur = 50 * (bass + 0.3)
      ctx.shadowColor = `hsla(${h}, 100%, 60%, ${bass * 0.8})`

      ctx.fillStyle = orbGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, bassRadius, 0, Math.PI * 2)
      ctx.fill()

      // Mid-frequency ring
      ctx.shadowBlur = 30 * mid
      ctx.strokeStyle = `hsla(${h}, 100%, 70%, ${mid * 0.7})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(centerX, centerY, midRadius * 1.3, 0, Math.PI * 2)
      ctx.stroke()

      // Treble particles
      const particleCount = 24
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + phase
        const distance = trebleRadius * 1.6 + Math.sin(phase * 2 + i * 0.5) * 15
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance
        const size = 2 + treble * 4

        ctx.shadowBlur = 10 * treble
        ctx.fillStyle = `hsla(${h}, 100%, 75%, ${treble * 0.8})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Core white highlight
      const coreGradient = ctx.createRadialGradient(
        centerX - bassRadius * 0.3,
        centerY - bassRadius * 0.3,
        0,
        centerX - bassRadius * 0.3,
        centerY - bassRadius * 0.3,
        bassRadius * 0.4,
      )
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

      ctx.shadowBlur = 0
      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(
        centerX - bassRadius * 0.3,
        centerY - bassRadius * 0.3,
        bassRadius * 0.4,
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
