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

// Bilateral mirrored frequency spectrum — bars go both up and down from center
export function WaveformTunnel() {
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
    let pendingWidth = 0
    let pendingHeight = 0
    let stableFrames = 0

    const commitResize = (width: number, height: number) => {
      if (canvas.width === width && canvas.height === height) return
      canvas.width = width
      canvas.height = height
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const scheduleStableResize = () => {
      const width = Math.floor(canvas.clientWidth * dpr)
      const height = Math.floor(canvas.clientHeight * dpr)
      if (width <= 0 || height <= 0) return

      if (width !== pendingWidth || height !== pendingHeight) {
        pendingWidth = width
        pendingHeight = height
        stableFrames = 0
        return
      }

      if (stableFrames < 2) {
        stableFrames += 1
        return
      }

      commitResize(pendingWidth, pendingHeight)
    }

    const BUF = 256
    const freqBuf = new Uint8Array(BUF)
    const smoothed = new Float32Array(BUF)
    let animId: number

    const draw = () => {
      const analyser = getGlobalAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(freqBuf)
        for (let i = 0; i < BUF; i++) {
          smoothed[i] = smoothed[i] * 0.80 + freqBuf[i] * 0.20
        }
      }

      scheduleStableResize()

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cy = h / 2
      const palette = paletteRef.current
      const c1 = palette?.vibrant ?? null
      const c2 = palette?.accent ?? null
      const { h: ah, s: as_, l: al } = accentHSL()

      ctx.clearRect(0, 0, w, h)

      const BAR_COUNT = 90
      const totalW = w * 0.90
      const startX = (w - totalW) / 2
      const barW = totalW / BAR_COUNT
      const gap = Math.max(1, barW * 0.18)
      const maxH = h * 0.42

      // Horizontal color gradient (vibrant on edges, accent in center)
      const hGrad = ctx.createLinearGradient(startX, 0, startX + totalW, 0)
      if (c1 && c2) {
        hGrad.addColorStop(0, hexToRgba(c2, 0.85))
        hGrad.addColorStop(0.35, hexToRgba(c1, 0.95))
        hGrad.addColorStop(0.65, hexToRgba(c1, 0.95))
        hGrad.addColorStop(1, hexToRgba(c2, 0.85))
      } else {
        const hue2 = (parseFloat(ah) + 40) % 360
        hGrad.addColorStop(0, `hsla(${hue2}, ${as_}, ${al}, 0.85)`)
        hGrad.addColorStop(0.5, `hsla(${ah}, 100%, 68%, 0.95)`)
        hGrad.addColorStop(1, `hsla(${hue2}, ${as_}, ${al}, 0.85)`)
      }

      // Glow pass
      ctx.save()
      ctx.shadowBlur = 16
      ctx.shadowColor = c1 ? hexToRgba(c1, 0.55) : `hsla(${ah}, ${as_}, ${al}, 0.5)`
      ctx.fillStyle = c1 ? hexToRgba(c1, 0.35) : `hsla(${ah}, ${as_}, ${al}, 0.35)`
      for (let i = 0; i < BAR_COUNT; i++) {
        const freqIdx = Math.floor((i / BAR_COUNT) * (BUF / 2))
        const norm = smoothed[freqIdx] / 255
        const barH = Math.max(2, norm * maxH)
        const x = startX + i * barW
        const bw = barW - gap
        ctx.fillRect(x, cy - barH, bw, barH * 2)
      }
      ctx.restore()

      // Main bars
      ctx.fillStyle = hGrad
      for (let i = 0; i < BAR_COUNT; i++) {
        const freqIdx = Math.floor((i / BAR_COUNT) * (BUF / 2))
        const norm = smoothed[freqIdx] / 255
        const barH = Math.max(2, norm * maxH)
        const x = startX + i * barW
        const bw = barW - gap

        // Upper half — rounded top
        ctx.beginPath()
        if (barH > 4) {
          const r = Math.min(bw / 2, 3)
          ctx.moveTo(x + r, cy - barH)
          ctx.lineTo(x + bw - r, cy - barH)
          ctx.arcTo(x + bw, cy - barH, x + bw, cy - barH + r, r)
          ctx.lineTo(x + bw, cy)
          ctx.lineTo(x, cy)
          ctx.arcTo(x, cy - barH, x + r, cy - barH, r)
          ctx.closePath()
        } else {
          ctx.rect(x, cy - barH, bw, barH)
        }
        ctx.fill()

        // Lower half — rounded bottom (mirror)
        ctx.beginPath()
        if (barH > 4) {
          const r = Math.min(bw / 2, 3)
          ctx.moveTo(x, cy)
          ctx.lineTo(x + bw, cy)
          ctx.lineTo(x + bw, cy + barH - r)
          ctx.arcTo(x + bw, cy + barH, x + bw - r, cy + barH, r)
          ctx.lineTo(x + r, cy + barH)
          ctx.arcTo(x, cy + barH, x, cy + barH - r, r)
          ctx.closePath()
        } else {
          ctx.rect(x, cy, bw, barH)
        }
        ctx.fill()
      }

      // Center divider line
      ctx.fillStyle = c2 ? hexToRgba(c2, 0.12) : 'rgba(255,255,255,0.07)'
      ctx.fillRect(startX, cy - 1, totalW, 2)

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}


