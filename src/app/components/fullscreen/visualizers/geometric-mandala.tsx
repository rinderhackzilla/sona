import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function GeometricMandala() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()
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

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Calculate average frequency for effects
      const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const intensity = avgFreq / 255

      // Slow rotation
      rotationRef.current += 0.002

      const segments = 8 // Kaleidoscope segments
      const layers = 5
      const maxRadius = Math.min(width, height) * 0.35

      ctx.save()
      ctx.translate(centerX, centerY)

      // Draw each segment
      for (let seg = 0; seg < segments; seg++) {
        ctx.save()
        ctx.rotate((Math.PI * 2 * seg) / segments + rotationRef.current)

        // Draw layers in each segment
        for (let layer = 0; layer < layers; layer++) {
          const progress = (layer + 1) / layers
          const radius = progress * maxRadius
          
          // Get frequency for this layer
          const freqIndex = Math.floor((layer / layers) * frequencyData.length)
          const freqValue = (frequencyData[freqIndex] || 0) / 255
          
          // Morph shape based on audio
          const points = 6
          const angleStep = (Math.PI * 2) / points
          const shapeRadius = radius * (0.8 + freqValue * 0.4)

          ctx.beginPath()
          for (let i = 0; i <= points; i++) {
            const angle = i * angleStep
            const r = shapeRadius * (1 + Math.sin(i + rotationRef.current * 2) * 0.1 * freqValue)
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r

            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.closePath()

          // Color shift based on frequency
          const hueShift = freqValue * 60
          const currentHue = (parseFloat(h) + hueShift) % 360

          ctx.strokeStyle = `hsla(${currentHue}, 100%, ${50 + progress * 20}%, ${0.6 + freqValue * 0.4})`
          ctx.lineWidth = 2 + freqValue * 2
          ctx.shadowBlur = 10 + freqValue * 20
          ctx.shadowColor = `hsla(${currentHue}, 100%, 60%, ${freqValue})`
          ctx.stroke()

          // Fill with low opacity
          ctx.fillStyle = `hsla(${currentHue}, 100%, 50%, ${freqValue * 0.2})`
          ctx.fill()
        }

        ctx.restore()
      }

      ctx.restore()

      // Central ornament
      ctx.shadowBlur = 0
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, 15 + i * 8 + intensity * 10, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${h}, 100%, ${60 + i * 10}%, ${0.7 - i * 0.15})`
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
  }, [frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
