import { useEffect, useRef } from 'react'

export function RadialSpectrum() {
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
      const maxRadius = Math.min(width, height) * 0.4
      const time = Date.now() / 1000

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Radial spectrum bars
      const barCount = 80
      const angleStep = (Math.PI * 2) / barCount

      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep + time * 0.5
        
        // Multiple frequency layers
        const wave1 = Math.sin(time * 2 + i * 0.1) * 0.5 + 0.5
        const wave2 = Math.sin(time * 3 - i * 0.15) * 0.3 + 0.5
        const combined = (wave1 + wave2) / 2
        
        const barLength = combined * maxRadius * 0.8

        const x1 = centerX + Math.cos(angle) * 30
        const y1 = centerY + Math.sin(angle) * 30
        const x2 = centerX + Math.cos(angle) * (30 + barLength)
        const y2 = centerY + Math.sin(angle) * (30 + barLength)

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
        gradient.addColorStop(0, `hsla(${h}, ${s}, ${l}, 0.2)`)
        gradient.addColorStop(1, `hsla(${h}, ${s}, ${l}, 0.95)`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // Central rotating core
      for (let i = 0; i < 3; i++) {
        const scale = 1 + Math.sin(time * 3 + i) * 0.2
        ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${0.4 - i * 0.1})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, 25 * scale + i * 5, 0, Math.PI * 2)
        ctx.stroke()
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
