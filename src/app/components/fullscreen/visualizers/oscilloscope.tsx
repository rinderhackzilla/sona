import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { timeData } = useAudioAnalyser()
  const frameCountRef = useRef(0)

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

      // Skip frames to reduce refresh rate (60fps -> 30fps)
      frameCountRef.current++
      if (frameCountRef.current % 2 !== 0) {
        animationId = requestAnimationFrame(draw)
        return
      }

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      // Clear background completely
      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Use only ~10% of data points (step = 10) for clean minimal look
      const step = 10
      const reducedLength = Math.floor(timeData.length / step)
      const sliceWidth = width / reducedLength
      
      // Draw multiple layers for glow effect with thicker lines
      for (let layer = 2; layer >= 0; layer--) {
        ctx.beginPath()
        ctx.lineWidth = 4 + layer * 3 // Thicker lines
        ctx.strokeStyle = `hsla(${h}, 100%, ${60 + layer * 10}%, ${0.7 - layer * 0.2})`
        ctx.shadowBlur = 20 + layer * 15
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${0.6 - layer * 0.15})`

        // Smooth curves using quadraticCurveTo
        for (let i = 0; i < reducedLength; i++) {
          const dataIndex = i * step
          const value = timeData[dataIndex] || 128
          const y = ((value - 128) / 128) * (height / 2) + height / 2
          const x = i * sliceWidth

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            // Get previous point for smooth curve
            const prevDataIndex = (i - 1) * step
            const prevValue = timeData[prevDataIndex] || 128
            const prevY = ((prevValue - 128) / 128) * (height / 2) + height / 2
            const prevX = (i - 1) * sliceWidth

            // Calculate control point (midpoint between current and previous)
            const cpX = (prevX + x) / 2
            const cpY = (prevY + y) / 2

            // Draw smooth curve
            ctx.quadraticCurveTo(prevX, prevY, cpX, cpY)
            
            // For last segment, draw to current point
            if (i === reducedLength - 1) {
              ctx.lineTo(x, y)
            }
          }
        }

        ctx.stroke()
      }

      ctx.shadowBlur = 0

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', updateSize)
    }
  }, [timeData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
