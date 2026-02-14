import { useEffect, useRef } from 'react'

export function FrequencyCircle() {
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
    let rotation = 0

    const draw = () => {
      if (!ctx || !canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * 0.25

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Rotating frequency bars
      const barCount = 64
      const time = Date.now() / 1000

      for (let i = 0; i < barCount; i++) {
        // Create organic movement
        const angle = (i / barCount) * Math.PI * 2 + rotation
        const wave = Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5
        const barHeight = (30 + wave * radius * 0.5) * (0.6 + Math.sin(time * 3 + i * 0.1) * 0.4)

        const x1 = centerX + Math.cos(angle) * radius
        const y1 = centerY + Math.sin(angle) * radius
        const x2 = centerX + Math.cos(angle) * (radius + barHeight)
        const y2 = centerY + Math.sin(angle) * (radius + barHeight)

        const alpha = 0.4 + wave * 0.6
        
        ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${alpha})`
        ctx.lineWidth = 3
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // Pulsing center circles
      for (let i = 0; i < 3; i++) {
        const scale = 1 + Math.sin(time * 2 - i * 0.5) * 0.15
        const r = radius * (0.8 - i * 0.15) * scale
        const alpha = 0.3 - i * 0.1
        
        ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${alpha})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      rotation += 0.005
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
