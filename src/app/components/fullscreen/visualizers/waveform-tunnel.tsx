import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function WaveformTunnel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { timeData, frequencyData } = useAudioAnalyser()
  const rotationRef = useRef(0)

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

      // Clear background completely
      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Auto-rotate slowly
      rotationRef.current += 0.003

      // Draw multiple rings creating tunnel effect
      const ringCount = 6
      const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const pulse = avgFreq / 255

      // Limit max radius to 35% of container to prevent clipping
      const maxRadius = Math.min(width, height) * 0.35

      for (let ring = 0; ring < ringCount; ring++) {
        const progress = ring / ringCount
        const radius = 50 + progress * maxRadius
        const pointCount = 64
        const angleStep = (Math.PI * 2) / pointCount

        ctx.beginPath()
        for (let i = 0; i <= pointCount; i++) {
          const angle = i * angleStep + rotationRef.current + ring * 0.5
          const dataIndex = Math.floor((i / pointCount) * timeData.length)
          const waveValue = (timeData[dataIndex] || 128) - 128
          // Reduce wave offset to prevent clipping
          const waveOffset = (waveValue / 128) * 20 * (1 - progress) * (1 + pulse * 0.5)

          const x = centerX + Math.cos(angle) * (radius + waveOffset)
          const y = centerY + Math.sin(angle) * (radius + waveOffset)

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()

        // Color based on depth and intensity
        const alpha = 0.3 + progress * 0.5 + pulse * 0.3
        const lightness = 50 + progress * 20
        ctx.strokeStyle = `hsla(${h}, 100%, ${lightness}%, ${alpha})`
        ctx.lineWidth = 2 + progress * 2
        ctx.shadowBlur = 10 + pulse * 20
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${pulse * 0.5})`
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
  }, [timeData, frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
