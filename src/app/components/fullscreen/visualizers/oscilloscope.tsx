import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { timeData } = useAudioAnalyser()

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

      // Clear background completely
      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Use only half the data points for cleaner look
      const step = 2
      const reducedLength = Math.floor(timeData.length / step)
      const sliceWidth = width / reducedLength
      
      // Draw multiple layers for glow effect
      for (let layer = 2; layer >= 0; layer--) {
        ctx.beginPath()
        ctx.lineWidth = 3 + layer * 2
        ctx.strokeStyle = `hsla(${h}, 100%, ${60 + layer * 10}%, ${0.7 - layer * 0.2})`
        ctx.shadowBlur = 15 + layer * 10
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${0.5 - layer * 0.15})`

        for (let i = 0; i < reducedLength; i++) {
          const dataIndex = i * step
          const value = timeData[dataIndex] || 128
          const y = ((value - 128) / 128) * (height / 2) + height / 2
          const x = i * sliceWidth

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
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
