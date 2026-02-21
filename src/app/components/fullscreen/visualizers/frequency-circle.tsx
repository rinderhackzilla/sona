import { useEffect, useRef } from 'react'
import { getGlobalAnalyser } from '@/app/hooks/use-audio-context'
import { useSongColor } from '@/store/player.store'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function accentHSL() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  const [h, s, l] = v.split(' ')
  return { h: h ?? '220', s: s ?? '80%', l: l ?? '60%' }
}

export function FrequencyCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentSongColorPalette } = useSongColor()
  const paletteRef = useRef(currentSongColorPalette)

  useEffect(() => {
    paletteRef.current = currentSongColorPalette
  }, [currentSongColorPalette])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const BUF = 256
    const freqBuf = new Uint8Array(BUF)
    const smoothed = new Float32Array(BUF)
    let animId: number

    const draw = () => {
      const analyser = getGlobalAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(freqBuf)
        for (let i = 0; i < BUF; i++) {
          smoothed[i] = smoothed[i] * 0.68 + freqBuf[i] * 0.32
        }
      }

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w / 2
      const cy = h / 2
      const size = Math.min(w, h)
      const innerR = size * 0.22
      const maxBarH = size * 0.34
      const palette = paletteRef.current
      const c1 = palette?.vibrant ?? null
      const c2 = palette?.accent ?? null
      const cdom = palette?.dominant ?? null
      const { h: ah, s: as_, l: al } = accentHSL()

      ctx.clearRect(0, 0, w, h)

      const BAR_COUNT = 128
      const TWO_PI = Math.PI * 2
      const barW = ((TWO_PI * innerR) / BAR_COUNT) * 0.75

      // Bass average for center pulse
      let bassSum = 0
      for (let i = 0; i < 8; i++) bassSum += smoothed[i]
      const bassAvg = bassSum / 8 / 255

      // Draw bars
      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = (i / BAR_COUNT) * TWO_PI - Math.PI / 2
        const freqIdx = Math.floor((i / BAR_COUNT) * (BUF / 2))
        const norm = smoothed[freqIdx] / 255
        // Power curve: low-level signals stay small, only loud frequencies make tall bars
        const barH = Math.pow(norm, 1.8) * maxBarH
        if (barH < 0.5) continue

        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const x1 = cx + cos * innerR
        const y1 = cy + sin * innerR
        const x2 = cx + cos * (innerR + barH)
        const y2 = cy + sin * (innerR + barH)

        const grad = ctx.createLinearGradient(x1, y1, x2, y2)
        if (c1 && c2) {
          grad.addColorStop(0, hexToRgba(c1, 0.55 + norm * 0.2))
          grad.addColorStop(1, hexToRgba(c2, Math.min(1, norm * 1.3)))
        } else {
          grad.addColorStop(0, `hsla(${ah}, ${as_}, ${al}, ${0.55 + norm * 0.2})`)
          grad.addColorStop(1, `hsla(${ah}, 100%, 72%, ${Math.min(1, norm * 1.3)})`)
        }

        ctx.shadowBlur = 6 + barH * 0.22
        ctx.shadowColor = c1 ? hexToRgba(c1, norm * 0.65) : `hsla(${ah}, 100%, 65%, ${norm * 0.65})`
        ctx.strokeStyle = grad
        ctx.lineWidth = Math.max(1.5, barW)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      ctx.shadowBlur = 0

      // Central radial fill (pulses with bass)
      const pulseR = innerR * (1 + bassAvg * 0.02)
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR)
      const dc = cdom ?? c1
      if (dc) {
        centerGrad.addColorStop(0, hexToRgba(dc, 0.38 + bassAvg * 0.3))
        centerGrad.addColorStop(0.55, hexToRgba(dc, 0.14))
        centerGrad.addColorStop(1, hexToRgba(dc, 0))
      } else {
        centerGrad.addColorStop(0, `hsla(${ah}, 60%, 55%, ${0.32 + bassAvg * 0.3})`)
        centerGrad.addColorStop(1, `hsla(${ah}, 60%, 55%, 0)`)
      }
      ctx.beginPath()
      ctx.arc(cx, cy, pulseR, 0, TWO_PI)
      ctx.fillStyle = centerGrad
      ctx.fill()

      // Inner ring stroke
      ctx.beginPath()
      ctx.arc(cx, cy, innerR, 0, TWO_PI)
      ctx.strokeStyle = c1 ? hexToRgba(c1, 0.35 + bassAvg * 0.08) : `rgba(255,255,255,0.25)`
      ctx.lineWidth = 1.5
      ctx.stroke()

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}
