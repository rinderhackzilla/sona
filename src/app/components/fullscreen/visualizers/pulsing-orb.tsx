import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'
import { useSongColor } from '@/store/player.store'

export function PulsingOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frequencyData } = useAudioAnalyser()
  const { currentSongColorPalette } = useSongColor()

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

    // Helper: Convert hex to hsla
    const hexToHsla = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0
      let s = 0
      const l = (max + min) / 2

      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6
            break
          case g:
            h = ((b - r) / d + 2) / 6
            break
          case b:
            h = ((r - g) / d + 4) / 6
            break
        }
      }

      return `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${alpha})`
    }

    const draw = () => {
      if (!ctx || !canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerX = width / 2
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      // Get palette or fallback
      const palette = currentSongColorPalette
        ? [
            currentSongColorPalette.vibrant,
            currentSongColorPalette.accent,
            currentSongColorPalette.dominant,
            currentSongColorPalette.muted,
          ]
        : null

      // Fallback to CSS accent if no palette
      const getFallbackHSL = () => {
        const accentHSL = getComputedStyle(document.documentElement)
          .getPropertyValue('--accent')
          .trim()
        return accentHSL
      }

      const getColor = (index: number, alpha: number) => {
        if (palette) {
          return hexToHsla(palette[index % 4], alpha)
        }
        const [h, s, l] = getFallbackHSL().split(' ')
        return `hsla(${h}, ${s}, ${l}, ${alpha})`
      }

      // Calculate frequency bands
      const bassData = frequencyData.slice(0, 8)
      const midData = frequencyData.slice(8, 32)
      const trebleData = frequencyData.slice(32, 64)
      const highData = frequencyData.slice(64, 96)

      const bass = bassData.reduce((a, b) => a + b, 0) / (bassData.length * 255)
      const mid = midData.reduce((a, b) => a + b, 0) / (midData.length * 255)
      const treble =
        trebleData.reduce((a, b) => a + b, 0) / (trebleData.length * 255)
      const high = highData.reduce((a, b) => a + b, 0) / (highData.length * 255)

      const baseRadius = Math.min(width, height) * 0.18

      phase += 0.08 + bass * 0.12

      // Layer 6: Outermost ring particles (Muted color)
      const outerRingCount = 32
      for (let i = 0; i < outerRingCount; i++) {
        const angle = (Math.PI * 2 * i) / outerRingCount - phase * 3.5
        const radius = baseRadius * (2.2 + Math.sin(phase * 2 + i * 0.2) * 0.15)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 1.5 + high * 4

        ctx.fillStyle = getColor(3, 0.4 + high * 0.5) // Muted
        ctx.shadowBlur = 6 * high
        ctx.shadowColor = getColor(3, high * 0.4)
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Layer 5: Large orbit particles (Dominant color)
      const largeOrbitCount = 16
      for (let i = 0; i < largeOrbitCount; i++) {
        const angle = (Math.PI * 2 * i) / largeOrbitCount + phase * 2.0
        const radius = baseRadius * (2.0 + Math.sin(phase * 1.5 + i * 0.4) * 0.2)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 2.5 + treble * 5

        ctx.fillStyle = getColor(2, 0.5 + treble * 0.4) // Dominant
        ctx.shadowBlur = 12 * treble
        ctx.shadowColor = getColor(2, treble * 0.5)
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Layer 4: Mid-range ring (Accent color)
      const midRingRadius = baseRadius * (1.7 + mid * 0.4)
      ctx.strokeStyle = getColor(1, 0.5 + mid * 0.4) // Accent
      ctx.lineWidth = 2 + mid * 3
      ctx.shadowBlur = 20 * mid
      ctx.shadowColor = getColor(1, mid * 0.6)
      ctx.beginPath()
      ctx.arc(centerX, centerY, midRingRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Layer 3: Dense particle ring (Vibrant color)
      const denseRingCount = 48
      for (let i = 0; i < denseRingCount; i++) {
        const angle = (Math.PI * 2 * i) / denseRingCount + phase * 2.8
        const radius = baseRadius * (1.4 + Math.sin(phase * 3 + i * 0.15) * 0.1)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 1 + mid * 2.5

        ctx.fillStyle = getColor(0, 0.6 + mid * 0.3) // Vibrant
        ctx.shadowBlur = 4
        ctx.shadowColor = getColor(0, 0.3)
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Layer 2: Inner core ring (Accent color)
      const coreRingRadius = baseRadius * (0.8 + bass * 0.5)
      ctx.strokeStyle = getColor(1, 0.7 + bass * 0.3) // Accent
      ctx.lineWidth = 3 + bass * 5
      ctx.shadowBlur = 25 * bass
      ctx.shadowColor = getColor(1, bass * 0.7)
      ctx.beginPath()
      ctx.arc(centerX, centerY, coreRingRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Layer 1: Center particles (Vibrant color)
      const centerCount = 12
      for (let i = 0; i < centerCount; i++) {
        const angle = (Math.PI * 2 * i) / centerCount - phase * 4.5
        const radius = baseRadius * (0.4 + bass * 0.3)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const size = 2 + bass * 4

        ctx.fillStyle = getColor(0, 0.8 + bass * 0.2) // Vibrant
        ctx.shadowBlur = 15 * bass
        ctx.shadowColor = getColor(0, bass * 0.6)
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Absolute center dot (Vibrant)
      ctx.fillStyle = getColor(0, 0.9)
      ctx.shadowBlur = 20 * (bass + 0.2)
      ctx.shadowColor = getColor(0, 0.8)
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
  }, [frequencyData, currentSongColorPalette])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
