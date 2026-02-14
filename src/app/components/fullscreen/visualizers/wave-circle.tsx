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
      const baseRadius = Math.min(width, height) * 0.25

      ctx.clearRect(0, 0, width, height)

      const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()

      // Draw multiple wave circles
      const waveCount = 3
      for (let wave = 0; wave < waveCount; wave++) {
        const points = 128
        const angleStep = (Math.PI * 2) / points
        const phaseOffset = wave * 0.5

        ctx.beginPath()
        ctx.strokeStyle = `hsl(${accentColor})`
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7 - wave * 0.2

        for (let i = 0; i <= points; i++) {
          const angle = i * angleStep
          const dataIndex = Math.floor((i / points) * frequencyData.length)
          const value = frequencyData[dataIndex] || 0
          const waveOffset = (value / 255) * 50 * (1 - wave * 0.3)
          const radius = baseRadius * (1 + wave * 0.3) + waveOffset

          const x = centerX + Math.cos(angle + phaseOffset) * radius
          const y = centerY + Math.sin(angle + phaseOffset) * radius

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        ctx.stroke()
      }

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
