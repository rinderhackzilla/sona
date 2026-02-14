import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function AudioLandscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()
  const offsetRef = useRef(0)
  const historyRef = useRef<number[][]>([])

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

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Add current frequency snapshot to history
      const snapshot = Array.from(frequencyData.slice(0, 64))
      historyRef.current.unshift(snapshot)

      // Keep only last 60 frames
      if (historyRef.current.length > 60) {
        historyRef.current = historyRef.current.slice(0, 60)
      }

      // Scroll offset
      offsetRef.current += 2
      if (offsetRef.current > height / 60) {
        offsetRef.current = 0
      }

      // Draw landscape from back to front for 3D effect
      for (let row = historyRef.current.length - 1; row >= 0; row--) {
        const rowData = historyRef.current[row]
        if (!rowData) continue

        const progress = row / historyRef.current.length
        const y = height * 0.8 - progress * height * 0.5 + offsetRef.current
        const scale = 0.5 + progress * 0.5 // Perspective scaling

        ctx.beginPath()
        const barCount = rowData.length
        const barWidth = (width * scale) / barCount
        const startX = (width - width * scale) / 2

        for (let i = 0; i < barCount; i++) {
          const freqValue = rowData[i] || 0
          const normalizedValue = freqValue / 255
          const barHeight = normalizedValue * 150 * scale

          const x = startX + i * barWidth
          const barY = y - barHeight

          if (i === 0) {
            ctx.moveTo(x, y)
            ctx.lineTo(x, barY)
          } else {
            ctx.lineTo(x, barY)
          }
        }

        // Complete the shape
        ctx.lineTo(startX + barCount * barWidth, y)
        ctx.lineTo(startX, y)
        ctx.closePath()

        // Gradient fill from bottom to top
        const gradient = ctx.createLinearGradient(0, y, 0, y - 150 * scale)
        gradient.addColorStop(0, `hsla(${h}, 100%, 30%, ${0.3 * progress})`)
        gradient.addColorStop(1, `hsla(${h}, 100%, 60%, ${0.7 * progress})`)
        ctx.fillStyle = gradient
        ctx.fill()

        // Wireframe on top
        ctx.strokeStyle = `hsla(${h}, 100%, ${60 + progress * 20}%, ${0.6 + progress * 0.4})`
        ctx.lineWidth = 1 + progress * 1.5
        ctx.shadowBlur = 8 * progress
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${progress * 0.5})`
        ctx.stroke()
      }

      ctx.shadowBlur = 0

      // Draw horizon line
      ctx.strokeStyle = `hsla(${h}, 100%, 50%, 0.3)`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, height * 0.8)
      ctx.lineTo(width, height * 0.8)
      ctx.stroke()

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
