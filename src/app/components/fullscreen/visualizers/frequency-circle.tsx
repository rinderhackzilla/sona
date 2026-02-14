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
      const radius = Math.min(width, height) * 0.28

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      const barCount = Math.min(frequencyData.length, 64)
      const angleStep = (Math.PI * 2) / barCount

      const bassData = Array.from(frequencyData.slice(0, 12))
      const bassAvg = bassData.reduce((a, b) => a + b, 0) / bassData.length
      const bassBoost = bassAvg / 255

      // Draw bars with TRIPLE GLOW layers
      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep - Math.PI / 2
        
        const frequencyValue = frequencyData[i] || 0
        let normalizedValue = frequencyValue / 255
        
        // REDUCED BASS BOOST: only 10%
        if (i < 16) {
          normalizedValue = Math.min(1, normalizedValue * 1.1)
        }
        
        const barHeight = normalizedValue * radius * 0.65

        const x1 = centerX + Math.cos(angle) * radius
        const y1 = centerY + Math.sin(angle) * radius
        const x2 = centerX + Math.cos(angle) * (radius + barHeight)
        const y2 = centerY + Math.sin(angle) * (radius + barHeight)

        // Draw MULTIPLE glow layers for each bar
        for (let layer = 2; layer >= 0; layer--) {
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
          gradient.addColorStop(0, `hsla(${h}, 100%, ${50 + layer * 10}%, ${0.3 - layer * 0.1})`)
          gradient.addColorStop(1, `hsla(${h}, 100%, ${70 + layer * 10}%, ${normalizedValue * (0.8 - layer * 0.2)})`)

          // MASSIVE GLOW - each layer has different blur
          ctx.shadowBlur = (25 + layer * 20) * normalizedValue
          ctx.shadowColor = `hsla(${h}, 100%, ${60 + layer * 10}%, ${normalizedValue})`

          ctx.strokeStyle = gradient
          ctx.lineWidth = (width / barCount) * 0.8 + layer * 2
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }

        // Add floating particles on high values
        if (normalizedValue > 0.7) {
          const particleRadius = radius + barHeight + 10
          const particleX = centerX + Math.cos(angle) * particleRadius
          const particleY = centerY + Math.sin(angle) * particleRadius
          
          // Draw particle with multiple glow rings
          for (let r = 2; r >= 0; r--) {
            ctx.beginPath()
            ctx.arc(particleX, particleY, 3 + normalizedValue * 4 + r * 4, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${h}, 100%, ${70 + r * 10}%, ${normalizedValue * (0.6 - r * 0.2)})`
            ctx.shadowBlur = 25 + r * 10
            ctx.shadowColor = `hsla(${h}, 100%, 70%, ${normalizedValue})`
            ctx.fill()
          }
        }
      }

      ctx.shadowBlur = 0

      // TRIPLE ring outline with MASSIVE glow
      const pulseRadius = radius * (1 + bassBoost * 0.1)
      
      for (let ring = 2; ring >= 0; ring--) {
        ctx.strokeStyle = `hsla(${h}, 100%, ${60 + ring * 10}%, ${0.7 + bassBoost * 0.3 - ring * 0.15})`
        ctx.lineWidth = 3 + bassBoost * 3 + ring * 2
        ctx.shadowBlur = 30 + bassBoost * 30 + ring * 15
        ctx.shadowColor = `hsla(${h}, 100%, 70%, ${(bassBoost + 0.5) * (0.8 - ring * 0.2)})`
        ctx.beginPath()
        ctx.arc(centerX, centerY, pulseRadius + ring * 3, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Inner glow rings
      if (bassBoost > 0.3) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * (0.85 - i * 0.05), 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${h}, 100%, ${70 + i * 10}%, ${bassBoost * (0.5 - i * 0.1)})`
          ctx.lineWidth = 2
          ctx.shadowBlur = 20 + i * 10
          ctx.stroke()
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
