import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function WaveCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { timeData, frequencyData } = useAudioAnalyser()

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
      const radius = Math.min(width, height) * 0.3

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Use REAL waveform data
      const pointCount = Math.min(timeData.length, 128)
      const angleStep = (Math.PI * 2) / pointCount

      // Draw waveform circle
      ctx.beginPath()
      for (let i = 0; i < pointCount; i++) {
        const angle = i * angleStep
        
        // Get real waveform value (0-255, centered at 128)
        const waveValue = timeData[i] || 128
        const normalizedWave = (waveValue - 128) / 128 // -1 to 1
        const waveRadius = radius + normalizedWave * radius * 0.5

        const x = centerX + Math.cos(angle) * waveRadius
        const y = centerY + Math.sin(angle) * waveRadius

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()

      // Color based on average frequency
      const avgFrequency = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const alpha = 0.3 + (avgFrequency / 255) * 0.6

      ctx.fillStyle = `hsla(${h}, ${s}, ${l}, ${alpha * 0.2})`
      ctx.fill()
      ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${alpha})`
      ctx.lineWidth = 2
      ctx.stroke()

      // Inner reference circle
      ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, 0.3)`
      ctx.lineWidth = 1
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
  }, [timeData, frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
