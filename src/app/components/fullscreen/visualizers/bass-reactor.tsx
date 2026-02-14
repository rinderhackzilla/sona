import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function BassReactor() {
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

      // Get bass frequencies (first 8 bins)
      const bassData = Array.from(frequencyData.slice(0, 8))
      const bassAvg = bassData.reduce((a, b) => a + b, 0) / bassData.length
      const bassNorm = bassAvg / 255

      // Get mid frequencies
      const midData = Array.from(frequencyData.slice(8, 32))
      const midAvg = midData.reduce((a, b) => a + b, 0) / midData.length
      const midNorm = midAvg / 255

      // Get high frequencies
      const highData = Array.from(frequencyData.slice(32, 64))
      const highAvg = highData.reduce((a, b) => a + b, 0) / highData.length
      const highNorm = highAvg / 255

      // Draw concentric rings reacting to different frequencies
      // Reduce from 45% to 32% to fit better
      const maxRadius = Math.min(width, height) * 0.32

      // Bass ring (innermost, biggest pulse)
      // Reduce multipliers to prevent overflow
      const bassRadius = 40 + bassNorm * maxRadius * 0.35
      ctx.beginPath()
      ctx.arc(centerX, centerY, bassRadius, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${h}, 100%, 50%, ${bassNorm * 0.3})`
      ctx.fill()
      ctx.strokeStyle = `hsla(${h}, 100%, 60%, ${0.7 + bassNorm * 0.3})`
      ctx.lineWidth = 4 + bassNorm * 6
      ctx.shadowBlur = 20 + bassNorm * 30
      ctx.shadowColor = `hsla(${h}, 100%, 50%, ${bassNorm})`
      ctx.stroke()

      // Mid ring
      const midRadius = bassRadius + 50 + midNorm * 30
      ctx.beginPath()
      ctx.arc(centerX, centerY, midRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${h}, 100%, 65%, ${0.6 + midNorm * 0.4})`
      ctx.lineWidth = 3 + midNorm * 4
      ctx.shadowBlur = 15 + midNorm * 20
      ctx.shadowColor = `hsla(${h}, 100%, 60%, ${midNorm * 0.8})`
      ctx.stroke()

      // High ring (outermost, fastest)
      const highRadius = midRadius + 40 + highNorm * 25
      ctx.beginPath()
      ctx.arc(centerX, centerY, highRadius, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${h}, 100%, 70%, ${0.5 + highNorm * 0.5})`
      ctx.lineWidth = 2 + highNorm * 3
      ctx.shadowBlur = 10 + highNorm * 15
      ctx.shadowColor = `hsla(${h}, 100%, 70%, ${highNorm * 0.7})`
      ctx.stroke()

      // Draw particles around rings based on bass
      const particleCount = Math.floor(bassNorm * 30)
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + Date.now() * 0.001
        const radius = bassRadius + 20
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        ctx.beginPath()
        ctx.arc(x, y, 2 + bassNorm * 3, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${h}, 100%, 70%, ${bassNorm})`
        ctx.shadowBlur = 8
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${bassNorm})`
        ctx.fill()
      }

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
