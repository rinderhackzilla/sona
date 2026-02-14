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

      // Calculate bass for effects
      const bassData = Array.from(frequencyData.slice(0, 12))
      const bassAvg = bassData.reduce((a, b) => a + b, 0) / bassData.length
      const bassBoost = bassAvg / 255

      // Auto-rotate slowly, faster on bass
      rotationRef.current += 0.003 + bassBoost * 0.008

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
          
          // BASS BOOST: amplify waveform based on bass
          const waveMultiplier = 1 + bassBoost * 0.8
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

        // Color based on depth and intensity - shift hue on bass
        const alpha = 0.3 + progress * 0.5 + pulse * 0.3
        const lightness = 50 + progress * 20
        const hueShift = bassBoost * 20 // Shift hue on bass hits
        ctx.strokeStyle = `hsla(${(parseFloat(h) + hueShift) % 360}, 100%, ${lightness}%, ${alpha})`
        ctx.lineWidth = 2 + progress * 2 + bassBoost * 2
        ctx.shadowBlur = 10 + pulse * 20 + bassBoost * 15
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${pulse * 0.5 + bassBoost * 0.3})`
        ctx.stroke()
      }

      // Add center burst on strong bass
      if (bassBoost > 0.5) {
        for (let i = 0; i < 5; i++) {
          const angle = (Date.now() * 0.003 + i * (Math.PI * 2 / 5)) % (Math.PI * 2)
          const burstRadius = 30 + bassBoost * 40
          const x = centerX + Math.cos(angle) * burstRadius
          const y = centerY + Math.sin(angle) * burstRadius
          
          ctx.beginPath()
          ctx.arc(x, y, 3 + bassBoost * 4, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${h}, 100%, 70%, ${bassBoost})`
          ctx.shadowBlur = 20
          ctx.shadowColor = `hsla(${h}, 100%, 60%, ${bassBoost})`
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
  }, [timeData, frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
