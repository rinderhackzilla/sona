import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function RadialSpectrum() {
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
      const maxRadius = Math.min(width, height) * 0.35

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      const bassData = Array.from(frequencyData.slice(0, 12))
      const bassAvg = bassData.reduce((a, b) => a + b, 0) / bassData.length
      const bassBoost = bassAvg / 255
      
      rotationRef.current += 0.003 + bassBoost * 0.01

      const barCount = Math.min(frequencyData.length, 80)
      const angleStep = (Math.PI * 2) / barCount

      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep + rotationRef.current
        
        const frequencyValue = frequencyData[i] || 0
        let normalizedValue = frequencyValue / 255
        
        // REDUCED BASS BOOST: only 10%
        if (i < 16) {
          normalizedValue = Math.min(1, normalizedValue * 1.1)
        }
        
        const barLength = normalizedValue * maxRadius * 0.75

        const x1 = centerX + Math.cos(angle) * 30
        const y1 = centerY + Math.sin(angle) * 30
        const x2 = centerX + Math.cos(angle) * (30 + barLength)
        const y2 = centerY + Math.sin(angle) * (30 + barLength)

        // TRIPLE LAYER bars for MEGA glow
        for (let layer = 2; layer >= 0; layer--) {
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
          gradient.addColorStop(0, `hsla(${h}, 100%, ${40 + layer * 10}%, ${0.3 - layer * 0.1})`)
          gradient.addColorStop(0.5, `hsla(${h}, 100%, ${60 + layer * 10}%, ${0.8 * normalizedValue * (1 - layer * 0.2)})`)
          gradient.addColorStop(1, `hsla(${h}, 100%, ${70 + layer * 10}%, ${normalizedValue * (1 - layer * 0.2)})`)

          // EXTREME GLOW - layer dependent
          ctx.shadowBlur = (30 + layer * 25) * normalizedValue
          ctx.shadowColor = `hsla(${h}, 100%, ${60 + layer * 10}%, ${normalizedValue})`

          ctx.strokeStyle = gradient
          ctx.lineWidth = 4 + layer * 3
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
        
        // Add MASSIVE sparkles on high values
        if (normalizedValue > 0.65) {
          const sparkleX = x2 + Math.cos(angle) * 12
          const sparkleY = y2 + Math.sin(angle) * 12
          
          // Multi-ring sparkle
          for (let ring = 3; ring >= 0; ring--) {
            ctx.beginPath()
            ctx.arc(sparkleX, sparkleY, 2 + normalizedValue * 3 + ring * 3, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${h}, 100%, ${80 + ring * 5}%, ${normalizedValue * (0.7 - ring * 0.15)})`
            ctx.shadowBlur = 30 + ring * 10
            ctx.shadowColor = `hsla(${h}, 100%, 70%, ${normalizedValue})`
            ctx.fill()
          }
        }
      }

      ctx.shadowBlur = 0

      // MASSIVE pulsing core with QUAD rings
      const avgFrequency = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const pulseScale = 1 + (avgFrequency / 255) * 0.6 + bassBoost * 0.3

      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `hsla(${h}, 100%, ${60 + i * 8}%, ${0.7 - i * 0.12 + bassBoost * 0.3})`
        ctx.lineWidth = 4 - i * 0.5
        ctx.shadowBlur = 20 + bassBoost * 30 + (4 - i) * 12
        ctx.shadowColor = `hsla(${h}, 100%, ${65 + i * 8}%, ${bassBoost + 0.5})`
        ctx.beginPath()
        ctx.arc(centerX, centerY, 25 * pulseScale + i * 6, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Outer glow halo
      ctx.beginPath()
      ctx.arc(centerX, centerY, 25 * pulseScale + 30, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${h}, 100%, 70%, ${bassBoost * 0.3})`
      ctx.lineWidth = 1
      ctx.shadowBlur = 40
      ctx.shadowColor = `hsla(${h}, 100%, 60%, ${bassBoost + 0.3})`
      ctx.stroke()

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
