import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function WaveCircle() {
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

      const baseRadius = Math.min(width, height) * 0.25
      const points = 128

      // Draw multiple wave circles
      const numCircles = 3
      for (let circle = 0; circle < numCircles; circle++) {
        ctx.beginPath()

        const circleRadius = baseRadius * (1 + circle * 0.3)
        const hueShift = circle * 15

        for (let i = 0; i <= points; i++) {
          const angle = (Math.PI * 2 * i) / points
          const dataIndex = Math.floor((i / points) * frequencyData.length)
          const amplitude = (frequencyData[dataIndex] || 0) / 255

          const radius = circleRadius + amplitude * 80 * (1 - circle * 0.2)
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        ctx.strokeStyle = `hsla(${Number.parseInt(h) + hueShift}, 100%, 60%, ${0.7 - circle * 0.2})`
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7 - circle * 0.2
        ctx.shadowBlur = 8
        ctx.shadowColor = `hsla(${Number.parseInt(h) + hueShift}, 100%, 60%, ${0.5 - circle * 0.15})`
        ctx.stroke()
      }

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
