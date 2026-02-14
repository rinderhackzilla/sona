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

      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      const bassData = Array.from(frequencyData.slice(0, 12))
      const bassAvg = bassData.reduce((a, b) => a + b, 0) / bassData.length
      const bassBoost = bassAvg / 255

      rotationRef.current += 0.003 + bassBoost * 0.008

      const ringCount = 6
      const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length
      const pulse = avgFreq / 255

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
          
          // REDUCED BASS BOOST: only 10%
          const waveMultiplier = 1 + bassBoost * 0.1
          const waveOffset = (waveValue / 128) * 20 * (1 - progress) * (1 + pulse * 0.5) * waveMultiplier

          const x = centerX + Math.cos(angle) * (radius + waveOffset)
          const y = centerY + Math.sin(angle) * (radius + waveOffset)

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()

        // TRIPLE layer rings with MASSIVE glow
        for (let layer = 2; layer >= 0; layer--) {
          const alpha = 0.25 + progress * 0.4 + pulse * 0.25 - layer * 0.08
          const lightness = 50 + progress * 20 + layer * 10
          
          ctx.strokeStyle = `hsla(${h}, 100%, ${lightness}%, ${alpha})`
          ctx.lineWidth = 2 + progress * 2 + bassBoost * 2 + layer * 2
          ctx.shadowBlur = (20 + pulse * 30 + bassBoost * 25 + layer * 20) * (1 + progress * 0.5)
          ctx.shadowColor = `hsla(${h}, 100%, ${60 + layer * 10}%, ${(pulse * 0.5 + bassBoost * 0.3) * (1 - layer * 0.2)})`
          ctx.stroke()
        }
      }

      // Add ENERGY AURA around entire effect
      const auraRadius = maxRadius + 60
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, auraRadius + i * 15, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${h}, 100%, ${65 + i * 10}%, ${pulse * (0.15 - i * 0.04)})`
        ctx.lineWidth = 1
        ctx.shadowBlur = 40 + i * 15
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${pulse * 0.3})`
        ctx.stroke()
      }

      // BLOOM effect in center on strong energy
      if (pulse > 0.4) {
        for (let i = 0; i < 5; i++) {
          const angle = (Date.now() * 0.003 + i * (Math.PI * 2 / 5)) % (Math.PI * 2)
          const burstRadius = 30 + pulse * 35
          const x = centerX + Math.cos(angle) * burstRadius
          const y = centerY + Math.sin(angle) * burstRadius
          
          // Multi-ring bloom particles
          for (let r = 2; r >= 0; r--) {
            ctx.beginPath()
            ctx.arc(x, y, 3 + pulse * 5 + r * 4, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${h}, 100%, ${70 + r * 10}%, ${pulse * (0.7 - r * 0.2)})`
            ctx.shadowBlur = 30 + r * 15
            ctx.shadowColor = `hsla(${h}, 100%, 60%, ${pulse})`
            ctx.fill()
          }
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
  }, [timeData, frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
