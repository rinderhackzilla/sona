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
      // Reduce from 35% to 28%
      const radius = Math.min(width, height) * 0.28

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Use REAL frequency data
      const barCount = Math.min(frequencyData.length, 64)
      const angleStep = (Math.PI * 2) / barCount

      // Calculate bass average for extra effects
      const bassData = Array.from(frequencyData.slice(0, 12))
      const bassAvg = bassData.reduce((a, b) => a + b, 0) / bassData.length
      const bassBoost = bassAvg / 255

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep - Math.PI / 2
        
        // Get real frequency value
        const frequencyValue = frequencyData[i] || 0
        let normalizedValue = frequencyValue / 255
        
        // BASS BOOST: amplify lower frequencies (first 16 bars = bass/low-mid)
        if (i < 16) {
          normalizedValue = Math.min(1, normalizedValue * 1.8) // 80% boost for bass
        } else if (i < 32) {
          normalizedValue = Math.min(1, normalizedValue * 1.3) // 30% boost for mid
        }
        
        const barHeight = normalizedValue * radius * 0.65

        const x1 = centerX + Math.cos(angle) * radius
        const y1 = centerY + Math.sin(angle) * radius
        const x2 = centerX + Math.cos(angle) * (radius + barHeight)
        const y2 = centerY + Math.sin(angle) * (radius + barHeight)

        // More vibrant gradient
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
        gradient.addColorStop(0, `hsla(${h}, 100%, 50%, 0.5)`)
        gradient.addColorStop(1, `hsla(${h}, 100%, 70%, ${normalizedValue})`)

        // Glow effect
        ctx.shadowBlur = 12 * normalizedValue
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${normalizedValue * 0.8})`

        ctx.strokeStyle = gradient
        ctx.lineWidth = (width / barCount) * 0.8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Add particle burst on high bass frequencies
        if (i < 8 && normalizedValue > 0.7) {
          const particleRadius = radius + barHeight + 8
          const particleX = centerX + Math.cos(angle) * particleRadius
          const particleY = centerY + Math.sin(angle) * particleRadius
          
          ctx.beginPath()
          ctx.arc(particleX, particleY, 2 + normalizedValue * 3, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${h}, 100%, 70%, ${normalizedValue})`
          ctx.shadowBlur = 15
          ctx.fill()
        }
      }

      // Reset shadow
      ctx.shadowBlur = 0

      // Brighter circle outline with bass pulse
      const pulseRadius = radius * (1 + bassBoost * 0.1)
      ctx.strokeStyle = `hsla(${h}, 100%, 60%, ${0.7 + bassBoost * 0.3})`
      ctx.lineWidth = 2 + bassBoost * 2
      ctx.shadowBlur = 10 + bassBoost * 15
      ctx.shadowColor = `hsla(${h}, 100%, 60%, ${bassBoost * 0.8})`
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Inner glow ring on bass hits
      if (bassBoost > 0.3) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${h}, 100%, 70%, ${bassBoost * 0.5})`
        ctx.lineWidth = 3
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
  }, [frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
