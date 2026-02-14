import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function CircularWaveform() {
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

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Calculate average frequency for pulse
      const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const pulse = avgFreq / 255

      // Base radius that pulses
      const baseRadius = Math.min(width, height) * (0.25 + pulse * 0.08)

      const pointCount = timeData.length
      const angleStep = (Math.PI * 2) / pointCount

      // Draw multiple concentric waveforms for depth
      for (let layer = 0; layer < 3; layer++) {
        const layerRadius = baseRadius * (1 + layer * 0.15)
        const layerIntensity = 1 - layer * 0.3

        ctx.beginPath()
        for (let i = 0; i <= pointCount; i++) {
          const angle = i * angleStep - Math.PI / 2
          const waveValue = (timeData[i % timeData.length] || 128) - 128
          const normalizedWave = waveValue / 128
          
          // Waveform affects radius
          const offset = normalizedWave * 30 * layerIntensity * (1 + pulse * 0.3)
          const radius = layerRadius + offset

          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()

        // Gradient stroke
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          layerRadius + 50
        )
        gradient.addColorStop(0, `hsla(${h}, 100%, 60%, ${0.8 * layerIntensity})`)
        gradient.addColorStop(1, `hsla(${h}, 100%, 70%, ${0.5 * layerIntensity})`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = 3 - layer * 0.5
        ctx.shadowBlur = (12 + pulse * 15) * layerIntensity
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${pulse * layerIntensity})`
        ctx.stroke()

        // Subtle fill for innermost layer
        if (layer === 0) {
          ctx.fillStyle = `hsla(${h}, 100%, 50%, ${pulse * 0.15})`
          ctx.fill()
        }
      }

      ctx.shadowBlur = 0

      // Central circle that pulses
      for (let i = 0; i < 2; i++) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, 20 + i * 10 + pulse * 15, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${h}, 100%, ${65 + i * 10}%, ${0.7 - i * 0.2})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

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
