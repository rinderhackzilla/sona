import { useEffect, useRef } from 'react'

export function PulsingOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      const time = Date.now() / 1000

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Main pulsing orb
      const basePulse = Math.sin(time * 2) * 0.3 + 1
      const baseRadius = Math.min(width, height) * 0.12 * basePulse

      // Multiple expanding rings
      for (let i = 0; i < 8; i++) {
        const phase = (time * 2 + i * 0.3) % (Math.PI * 2)
        const expansion = Math.sin(phase) * 0.5 + 0.5
        const r = baseRadius * (1 + expansion * 2 + i * 0.4)
        const alpha = (1 - expansion) * 0.4

        ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${alpha})`
        ctx.lineWidth = 2 + expansion * 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Central glowing orb with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.5)
      gradient.addColorStop(0, `hsla(${h}, ${s}, 70%, 0.9)`)
      gradient.addColorStop(0.5, `hsla(${h}, ${s}, ${l}, 0.6)`)
      gradient.addColorStop(1, `hsla(${h}, ${s}, ${l}, 0)`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Orbiting particles
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + time
        const orbit = baseRadius * 3
        const x = centerX + Math.cos(angle) * orbit
        const y = centerY + Math.sin(angle) * orbit
        const size = 3 + Math.sin(time * 3 + i) * 2

        ctx.fillStyle = `hsla(${h}, ${s}, ${l}, 0.8)`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

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
