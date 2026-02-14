import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function FrequencyCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    // Animation loop
    let animationId: number

    const draw = () => {
      if (!ctx || !canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * 0.25

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Get CSS theme color - parse HSL values correctly
      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      
      // accentHSL is like "240 100% 50%" - we need to build the full hsl() string
      const accentColor = accentHSL ? `hsl(${accentHSL})` : 'hsl(240, 100%, 50%)'

      // Draw frequency bars in circle
      const barCount = 128
      const dataSlice = Math.floor(frequencyData.length / barCount)

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataSlice
        const value = frequencyData[dataIndex] || 0
        const barHeight = (value / 255) * radius * 0.8

        const angle = (i / barCount) * Math.PI * 2
        const x1 = centerX + Math.cos(angle) * radius
        const y1 = centerY + Math.sin(angle) * radius
        const x2 = centerX + Math.cos(angle) * (radius + barHeight)
        const y2 = centerY + Math.sin(angle) * (radius + barHeight)

        // Color based on frequency intensity
        const alpha = 0.3 + (value / 255) * 0.7
        
        ctx.strokeStyle = accentColor
        ctx.globalAlpha = alpha
        ctx.lineWidth = 2
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // Draw center circle
      ctx.globalAlpha = 0.2
      ctx.strokeStyle = accentColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
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
