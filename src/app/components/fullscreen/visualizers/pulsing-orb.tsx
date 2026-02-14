import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function PulsingOrb() {
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
    let phase = 0

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

      // Calculate frequency bands
      const bassData = frequencyData.slice(0, 8)
      const midData = frequencyData.slice(8, 32)
      const trebleData = frequencyData.slice(32, 64)
      const highData = frequencyData.slice(64, 96)

      const bass = bassData.reduce((a, b) => a + b, 0) / (bassData.length * 255)
      const mid = midData.reduce((a, b) => a + b, 0) / (midData.length * 255)
      const treble = trebleData.reduce((a, b) => a + b, 0) / (trebleData.length * 255)
      const high = highData.reduce((a, b) => a + b, 0) / (highData.length * 255)

      const baseRadius = Math.min(width, height) * 0.18

      phase += 0.03 + bass * 0.05

      // Layer 6: Outermost ring particles (32 particles, fast rotation)
      const outerRingCount = 32
      for (let i = 0; i < outerRingCount; i++) {
        const angle = (Math.PI * 2 * i) / outerRingCount - phase * 1.5
        const radius = baseRadius * (2.8 + Math.sin(phase * 2 + i * 0.2) * 0.15)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 1.5 + high * 4

        ctx.fillStyle = `hsla(${h}, 100%, 85%, ${0.4 + high * 0.5})`
        ctx.shadowBlur = 6 * high
        ctx.shadowColor = `hsla(${h}, 100%, 80%, ${high * 0.4})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Layer 5: Large orbit particles (16 particles, slow counter-rotation)
      const largeOrbitCount = 16
      for (let i = 0; i < largeOrbitCount; i++) {
        const angle = (Math.PI * 2 * i) / largeOrbitCount + phase * 0.6
        const radius = baseRadius * (2.2 + Math.sin(phase * 1.5 + i * 0.4) * 0.2)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 2.5 + treble * 5

        ctx.fillStyle = `hsla(${h}, 100%, 75%, ${0.5 + treble * 0.4})`
        ctx.shadowBlur = 12 * treble
        ctx.shadowColor = `hsla(${h}, 100%, 70%, ${treble * 0.5})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Layer 4: Mid-range ring (pulsing)
      const midRingRadius = baseRadius * (1.7 + mid * 0.4)
      ctx.strokeStyle = `hsla(${h}, 100%, 70%, ${0.5 + mid * 0.4})`
      ctx.lineWidth = 2 + mid * 3
      ctx.shadowBlur = 20 * mid
      ctx.shadowColor = `hsla(${h}, 100%, 65%, ${mid * 0.6})`
      ctx.beginPath()
      ctx.arc(centerX, centerY, midRingRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Layer 3: Dense particle ring (48 particles, rotating)
      const denseRingCount = 48
      for (let i = 0; i < denseRingCount; i++) {
        const angle = (Math.PI * 2 * i) / denseRingCount + phase * 1.2
        const radius = baseRadius * (1.4 + Math.sin(phase * 3 + i * 0.15) * 0.1)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 1 + mid * 2.5

        ctx.fillStyle = `hsla(${h}, 100%, 80%, ${0.6 + mid * 0.3})`
        ctx.shadowBlur = 4
        ctx.shadowColor = `hsla(${h}, 100%, 75%, 0.3)`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Layer 2: Inner core ring (pulsing with bass)
      const coreRingRadius = baseRadius * (0.8 + bass * 0.5)
      ctx.strokeStyle = `hsla(${h}, 100%, 75%, ${0.7 + bass * 0.3})`
      ctx.lineWidth = 3 + bass * 5
      ctx.shadowBlur = 25 * bass
      ctx.shadowColor = `hsla(${h}, 100%, 70%, ${bass * 0.7})`
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRingRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Layer 1: Center particles (12 particles, rotating fast)
      const centerCount = 12
      for (let i = 0; i < centerCount; i++) {
        const angle = (Math.PI * 2 * i) / centerCount - phase * 2
        const radius = baseRadius * (0.4 + bass * 0.3)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 2 + bass * 4

        ctx.fillStyle = `hsla(${h}, 100%, 90%, ${0.8 + bass * 0.2})`
        ctx.shadowBlur = 15 * bass
        ctx.shadowColor = `hsla(${h}, 100%, 85%, ${bass * 0.6})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Absolute center dot
      ctx.fillStyle = `hsla(${h}, 100%, 95%, 0.9)`
      ctx.shadowBlur = 20 * (bass + 0.2)
      ctx.shadowColor = `hsla(${h}, 100%, 90%, 0.8)`
      ctx.beginPath()
      ctx.arc(centerX, centerY, 3 + bass * 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalAlpha = 1
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
