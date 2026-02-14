import { useEffect, useRef } from 'react'
import { useAudioAnalyser } from '@/app/hooks/use-audio-analyser'

export function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { timeData } = useAudioAnalyser()

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

      // Dark background with slight fade for phosphor trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.fillRect(0, 0, width, height)

      const accentHSL = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim()
      const [h, s, l] = accentHSL.split(' ')

      // Draw grid lines (oscilloscope style)
      ctx.strokeStyle = `hsla(${h}, 50%, 30%, 0.2)`
      ctx.lineWidth = 1
      
      // Vertical grid lines
      for (let x = 0; x < width; x += width / 10) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      
      // Horizontal grid lines
      for (let y = 0; y < height; y += height / 8) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Center line
      ctx.strokeStyle = `hsla(${h}, 50%, 40%, 0.4)`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()

      // Draw waveform with phosphor glow
      const sliceWidth = width / timeData.length
      
      // Draw multiple layers for glow effect
      for (let layer = 2; layer >= 0; layer--) {
        ctx.beginPath()
        ctx.lineWidth = 3 + layer * 2
        ctx.strokeStyle = `hsla(${h}, 100%, ${60 + layer * 10}%, ${0.7 - layer * 0.2})`
        ctx.shadowBlur = 15 + layer * 10
        ctx.shadowColor = `hsla(${h}, 100%, 60%, ${0.5 - layer * 0.15})`

        for (let i = 0; i < timeData.length; i++) {
          const value = timeData[i] || 128
          const y = ((value - 128) / 128) * (height / 2) + height / 2
          const x = i * sliceWidth

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
      }

      ctx.shadowBlur = 0

      // Draw scanlines for CRT effect
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.lineWidth = 1
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Vignette effect
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width / 2
      )
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', updateSize)
    }
  }, [timeData])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
