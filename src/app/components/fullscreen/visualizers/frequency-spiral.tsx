import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function FrequencySpiral() {
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

      // Trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Slow rotation
      rotationRef.current += 0.005

      // Draw spiral spectrum
      const dataCount = Math.min(frequencyData.length, 128)
      const turns = 3 // Number of spiral turns
      const maxRadius = Math.min(width, height) * 0.45

      ctx.beginPath()
      for (let i = 0; i < dataCount; i++) {
        const progress = i / dataCount
        const angle = progress * Math.PI * 2 * turns + rotationRef.current
        const radius = progress * maxRadius
        
        // Frequency value affects distance from spiral path
        const frequencyValue = frequencyData[i] || 0
        const normalizedValue = frequencyValue / 255
        const offset = normalizedValue * 50

        const x = centerX + Math.cos(angle) * (radius + offset)
        const y = centerY + Math.sin(angle) * (radius + offset)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        // Draw frequency bars perpendicular to spiral
        if (i % 4 === 0) {
          const barLength = normalizedValue * 30
          const perpAngle = angle + Math.PI / 2
          const barX = x + Math.cos(perpAngle) * barLength
          const barY = y + Math.sin(perpAngle) * barLength

          ctx.moveTo(x, y)
          ctx.lineTo(barX, barY)
          ctx.moveTo(x, y) // Return to spiral path
        }
      }

      // Gradient stroke for spiral
      const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length / 255
      ctx.strokeStyle = `hsla(${h}, 100%, ${50 + avgFreq * 20}%, ${0.7 + avgFreq * 0.3})`
      ctx.lineWidth = 2
      ctx.shadowBlur = 15 + avgFreq * 20
      ctx.shadowColor = `hsla(${h}, 100%, 60%, ${avgFreq * 0.8})`
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      // Draw glow points along spiral at high frequencies
      for (let i = 0; i < dataCount; i += 8) {
        const frequencyValue = frequencyData[i] || 0
        if (frequencyValue > 180) { // Only bright points
          const progress = i / dataCount
          const angle = progress * Math.PI * 2 * turns + rotationRef.current
          const radius = progress * maxRadius
          const normalizedValue = frequencyValue / 255
          
          const x = centerX + Math.cos(angle) * (radius + normalizedValue * 50)
          const y = centerY + Math.sin(angle) * (radius + normalizedValue * 50)

          ctx.beginPath()
          ctx.arc(x, y, 2 + normalizedValue * 4, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${h}, 100%, 70%, ${normalizedValue})`
          ctx.shadowBlur = 15
          ctx.shadowColor = `hsla(${h}, 100%, 60%, ${normalizedValue})`
          ctx.fill()
        }
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
