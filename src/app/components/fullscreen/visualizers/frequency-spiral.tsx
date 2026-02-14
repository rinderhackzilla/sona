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

      // Clear background completely
      ctx.clearRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Calculate bass for rotation boost
      const bassData = Array.from(frequencyData.slice(0, 12))
      const bassAvg = bassData.reduce((a, b) => a + b, 0) / bassData.length
      const bassBoost = bassAvg / 255

      // Slow rotation, faster on bass
      rotationRef.current += 0.005 + bassBoost * 0.01

      // Draw spiral spectrum
      const dataCount = Math.min(frequencyData.length, 128)
      const turns = 3 // Number of spiral turns
      // Limit to 35% to prevent clipping
      const maxRadius = Math.min(width, height) * 0.35

      ctx.beginPath()
      for (let i = 0; i < dataCount; i++) {
        const progress = i / dataCount
        const angle = progress * Math.PI * 2 * turns + rotationRef.current
        const radius = progress * maxRadius
        
        // Frequency value affects distance from spiral path
        const frequencyValue = frequencyData[i] || 0
        let normalizedValue = frequencyValue / 255
        
        // BASS BOOST for lower frequencies
        if (i < 20) {
          normalizedValue = Math.min(1, normalizedValue * 1.8)
        } else if (i < 40) {
          normalizedValue = Math.min(1, normalizedValue * 1.3)
        }
        
        const offset = normalizedValue * 35

        const x = centerX + Math.cos(angle) * (radius + offset)
        const y = centerY + Math.sin(angle) * (radius + offset)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        // Draw frequency bars perpendicular to spiral
        if (i % 4 === 0) {
          const barLength = normalizedValue * 25
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
      ctx.strokeStyle = `hsla(${h}, 100%, ${50 + avgFreq * 25}%, ${0.7 + avgFreq * 0.3})`
      ctx.lineWidth = 2 + bassBoost * 2
      ctx.shadowBlur = 15 + avgFreq * 25
      ctx.shadowColor = `hsla(${h}, 100%, 60%, ${avgFreq * 0.8})`
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      // Draw energy trails - glow points along spiral at high frequencies
      for (let i = 0; i < dataCount; i += 6) {
        const frequencyValue = frequencyData[i] || 0
        let normalizedValue = frequencyValue / 255
        
        // Boost bass visibility
        if (i < 20) {
          normalizedValue = Math.min(1, normalizedValue * 1.8)
        }
        
        if (normalizedValue > 0.6) { // Lower threshold
          const progress = i / dataCount
          const angle = progress * Math.PI * 2 * turns + rotationRef.current
          const radius = progress * maxRadius
          
          const x = centerX + Math.cos(angle) * (radius + normalizedValue * 35)
          const y = centerY + Math.sin(angle) * (radius + normalizedValue * 35)

          // Multiple concentric glows for trail effect
          for (let j = 0; j < 2; j++) {
            ctx.beginPath()
            ctx.arc(x, y, 2 + normalizedValue * 5 + j * 3, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${h}, 100%, ${70 + j * 10}%, ${normalizedValue * (0.8 - j * 0.3)})`
            ctx.shadowBlur = 18
            ctx.shadowColor = `hsla(${h}, 100%, 60%, ${normalizedValue * 0.8})`
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
  }, [frequencyData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
