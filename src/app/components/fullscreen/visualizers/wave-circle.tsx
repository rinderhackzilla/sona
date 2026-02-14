import { useEffect, useRef } from 'react'

export function WaveCircle() {
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
      const baseRadius = Math.min(width, height) * 0.25
      const time = Date.now() / 1000

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Multiple flowing wave circles
      const waveCount = 5
      for (let wave = 0; wave < waveCount; wave++) {
        const points = 150
        const angleStep = (Math.PI * 2) / points
        const phaseOffset = wave * 0.8 + time * 0.5

        ctx.beginPath()
        const alpha = 0.6 - wave * 0.1
        ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${alpha})`
        ctx.lineWidth = 2

        for (let i = 0; i <= points; i++) {
          const angle = i * angleStep
          
          // Complex wave patterns
          const wave1 = Math.sin(angle * 3 + time * 2 + phaseOffset)
          const wave2 = Math.sin(angle * 5 - time * 3 + phaseOffset * 2)
          const wave3 = Math.cos(angle * 2 + time + phaseOffset)
          
          const combined = (wave1 + wave2 * 0.5 + wave3 * 0.3) / 2.8
          const waveOffset = combined * 40 * (1 - wave * 0.15)
          
          const radius = baseRadius * (1 + wave * 0.25) + waveOffset

          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        ctx.stroke()

        // Add glow effect
        if (wave === 0) {
          ctx.shadowBlur = 20
          ctx.shadowColor = `hsla(${h}, ${s}, ${l}, 0.5)`
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }

      // Central pulsing dot
      const pulse = Math.sin(time * 3) * 0.5 + 0.5
      const dotRadius = 8 + pulse * 6
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dotRadius * 2)
      gradient.addColorStop(0, `hsla(${h}, ${s}, 70%, 0.9)`)
      gradient.addColorStop(1, `hsla(${h}, ${s}, ${l}, 0)`)
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, dotRadius * 2, 0, Math.PI * 2)
      ctx.fill()

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
