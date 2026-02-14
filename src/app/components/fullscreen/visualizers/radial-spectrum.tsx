import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function RadialSpectrum() {
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
      const maxRadius = Math.min(width, height) * 0.4

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Use REAL frequency data for radial bars
      const barCount = Math.min(frequencyData.length, 80)
      const angleStep = (Math.PI * 2) / barCount

      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep
        
        // Get real frequency value (0-255)
        const frequencyValue = frequencyData[i] || 0
        const normalizedValue = frequencyValue / 255 // 0-1
        
        const barLength = normalizedValue * maxRadius * 0.8

        const x1 = centerX + Math.cos(angle) * 30
        const y1 = centerY + Math.sin(angle) * 30
        const x2 = centerX + Math.cos(angle) * (30 + barLength)
        const y2 = centerY + Math.sin(angle) * (30 + barLength)

        // Gradient with MUCH more contrast
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
        gradient.addColorStop(0, `hsla(${h}, ${s}, ${l}, 0.4)`)
        gradient.addColorStop(0.5, `hsla(${h}, 100%, 60%, ${0.8 * normalizedValue})`)
        gradient.addColorStop(1, `hsla(${h}, 100%, 70%, ${normalizedValue})`)

        // Add glow effect
        ctx.shadowBlur = 15 * normalizedValue
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${normalizedValue})`

        ctx.strokeStyle = gradient
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // Reset shadow
      ctx.shadowBlur = 0

      // Central pulsing core based on average frequency
      const avgFrequency = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const pulseScale = 1 + (avgFrequency / 255) * 0.5

      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `hsla(${h}, 100%, ${60 + i * 10}%, ${0.6 - i * 0.15})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, 25 * pulseScale + i * 5, 0, Math.PI * 2)
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
