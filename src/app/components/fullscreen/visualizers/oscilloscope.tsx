import { useEffect, useRef } from 'react'
import { getGlobalAnalyser } from '@/app/hooks/use-audio-context'
import { useSongColor } from '@/store/player.store'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function Oscilloscope() {
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

    let scrollPhase = 0
    let hueShift = 0

    const NUM_H = 22
    const NUM_V = 16
    const NUM_SEG = 8   // fewer segments = smoother grid appearance
    const HORIZON = 0.50

    type FlyOrb = { tx: number; ty: number; t: number; speed: number }
    const orbs: FlyOrb[] = []
    // Beat detection: track the smoothed "previous bass" and fire on rising edges.
    // This detects the onset (kick drum attack) rather than sustained high levels,
    // so it works regardless of whether bass is consistently loud or not.
    let prevBassSmooth = 0
    let beatCooldown = 0

    let animId: number

    const draw = () => {
      const analyser = getGlobalAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(freqBuf)
        for (let i = 0; i < BUF; i++) {
          smoothed[i] = smoothed[i] * 0.65 + freqBuf[i] * 0.35
        }
      }

      scheduleStableResize()

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w / 2
      const hy = h * HORIZON
      const palette = paletteRef.current
      const c1 = palette?.vibrant ?? null
      const c2 = palette?.accent ?? null  // single accent color for orbs
      let bassSum = 0
      let midSum = 0
      let highSum = 0
      for (let i = 0; i < 6; i++) bassSum += smoothed[i]
      for (let i = 6; i < 40; i++) midSum += smoothed[i]
      for (let i = 40; i < 90; i++) highSum += smoothed[i]
      const bassAvg = bassSum / 6 / 255
      const midAvg = midSum / 34 / 255
      const highAvg = highSum / 50 / 255

      // Raw (unsmoothed) bass for beat detection — preserves transient spikes
      let bassRawSum = 0
      for (let i = 0; i < 6; i++) bassRawSum += freqBuf[i]
      const bassRaw = bassRawSum / 6 / 255

      scrollPhase = (scrollPhase + 0.014 + bassAvg * 0.10) % 1.0
      hueShift = (hueShift + 0.4 + midAvg * 1.8 + highAvg * 0.8) % 360

      // Grid intensity: mids and highs drive brightness, bass is subdued
      const gridIntensity = 0.18 + bassAvg * 0.14 + midAvg * 0.52 + highAvg * 0.34

      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'

      // ── Convergence lines — flash when frequency is active ────────────────────────
      const drawConvLines = (toX: (t: number) => number, toY: (t: number) => number) => {
        for (let i = 0; i <= NUM_V; i++) {
          const t = i / NUM_V
          const freqIdx = Math.floor(t * 50)
          const fv = smoothed[freqIdx] / 255
          if (fv < 0.22) continue

          const alpha = ((fv - 0.22) / 0.78 * 0.55 + bassAvg * 0.18) * gridIntensity
          const hue = (hueShift + t * 90) % 360
          const col = c1 ? hexToRgba(c1, alpha) : `hsla(${hue}, 90%, 60%, ${alpha})`

          ctx.beginPath()
          ctx.moveTo(cx, hy)
          ctx.lineTo(toX(t), toY(t))
          ctx.strokeStyle = col
          ctx.lineWidth = 0.5 + fv * 1.8
          ctx.shadowBlur = fv > 0.55 ? fv * 14 : 0
          ctx.shadowColor = c2 ? hexToRgba(c2, fv * 0.5) : `hsla(${hue}, 100%, 65%, ${fv * 0.5})`
          ctx.stroke()
        }
        ctx.shadowBlur = 0
      }

      drawConvLines(t => t * w, _ => h)
      drawConvLines(t => t * w, _ => 0)
      drawConvLines(_ => 0, t => t * h)
      drawConvLines(_ => w, t => t * h)

      // ── Depth lines — 4-wall square tunnel ───────────────────────────────────────
      type Side = 'floor' | 'ceil' | 'left' | 'right'

      // Frequency index 0 = bass (dark, muted), index 55 = highs (bright, vivid).
      // t0 is the segment position (0=left/bass, 1=right/highs on floor panel).
      const segColor = (freqIdx: number, fv: number, alpha: number, side: Side) => {
        const hue = (hueShift + (freqIdx / 55) * 80 + (side === 'ceil' || side === 'right' ? 55 : 0)) % 360
        const isHighFreq = freqIdx > 28   // mids and above
        const isMidFreq  = freqIdx > 10 && freqIdx <= 28
        // Bass: darker, lower lightness even when active
        if (!isHighFreq && !isMidFreq) {
          const l = 28 + fv * 18  // 28–46% lightness for bass
          return `hsla(${hue}, 65%, ${l}%, ${alpha * (0.5 + fv * 0.4)})`
        }
        // Mids: medium brightness
        if (isMidFreq) {
          if (c1 && fv > 0.35) return hexToRgba(c1, alpha * (0.6 + fv * 0.4))
          const l = 48 + fv * 18
          return `hsla(${hue}, 85%, ${l}%, ${alpha * (0.55 + fv * 0.45)})`
        }
        // Highs: full brightness, accent color when hot
        if (fv > 0.55) return c2 ? hexToRgba(c2, alpha) : `hsla(${hue}, 100%, 80%, ${alpha})`
        if (c1 && fv > 0.25) return hexToRgba(c1, alpha * (0.5 + fv * 0.5))
        const l = 60 + fv * 20
        return `hsla(${hue}, 95%, ${l}%, ${alpha})`
      }

      const drawPanel = (side: Side) => {
        const isHoriz = side === 'floor' || side === 'ceil'

        for (let i = 0; i < NUM_H + 2; i++) {
          const rawPhase = ((i / NUM_H) + scrollPhase) % 1.0
          const screenT = rawPhase * rawPhase

          let lx0: number
          let ly0: number
          let lx1: number
          let ly1: number

          if (isHoriz) {
            const dir = side === 'floor' ? 1 : -1
            const panelH = side === 'floor' ? h - hy : hy
            const y = hy + dir * panelH * screenT
            if (side === 'floor' && y >= h + 2) continue
            if (side === 'ceil' && y <= -2) continue
            lx0 = cx - cx * screenT;       ly0 = y
            lx1 = cx + (w - cx) * screenT; ly1 = y
          } else {
            const dir = side === 'left' ? -1 : 1
            const panelW = side === 'left' ? cx : w - cx
            const x = cx + dir * panelW * screenT
            if (side === 'left' && x <= -2) continue
            if (side === 'right' && x >= w + 2) continue
            lx0 = x; ly0 = hy - hy * screenT
            lx1 = x; ly1 = hy + (h - hy) * screenT
          }

          for (let s = 0; s < NUM_SEG; s++) {
            const t0 = s / NUM_SEG
            const t1 = (s + 1) / NUM_SEG

            let sx0: number
            let sy0: number
            let sx1: number
            let sy1: number
            if (isHoriz) {
              sx0 = lx0 + (lx1 - lx0) * t0; sy0 = ly0
              sx1 = lx0 + (lx1 - lx0) * t1; sy1 = ly1
            } else {
              sx0 = lx0; sy0 = ly0 + (ly1 - ly0) * t0
              sx1 = lx1; sy1 = ly0 + (ly1 - ly0) * t1
            }

            if (screenT > 0.45) {
              const wobble = screenT * (bassAvg * 6 + midAvg * 3)
                * Math.sin(scrollPhase * Math.PI * 10 + s * 0.9 + i * 0.5)
              if (isHoriz) { sy0 += wobble; sy1 += wobble }
              else { sx0 += wobble; sx1 += wobble }
            }

            const freqIdx = Math.floor(t0 * 55)
            const fv = smoothed[freqIdx] / 255

            // Proximity³ fade: far lines nearly invisible, only near ones pop
            const proximity = screenT * screenT * screenT
            const alpha = proximity * Math.pow(fv, 0.65) * 1.2 * gridIntensity
            if (alpha < 0.02) continue

            const lineW = 0.5 + screenT * 3.5 + fv * screenT * 2.8
            const col = segColor(freqIdx, fv, alpha, side)

            ctx.beginPath()
            ctx.moveTo(sx0, sy0)
            ctx.lineTo(sx1, sy1)
            ctx.strokeStyle = col
            ctx.lineWidth = lineW

            if (screenT > 0.65 && fv > 0.40) {
              const hue = (hueShift + t0 * 100) % 360
              ctx.shadowBlur = screenT * fv * 22
              ctx.shadowColor = c1 ? hexToRgba(c1, fv * 0.85) : `hsla(${hue}, 100%, 65%, ${fv * 0.75})`
            } else {
              ctx.shadowBlur = 0
            }
            ctx.stroke()
          }
        }
        ctx.shadowBlur = 0
      }

      drawPanel('floor')
      drawPanel('ceil')
      drawPanel('left')
      drawPanel('right')

      // ── Horizon cross-glow ────────────────────────────────────────────────────────
      for (const horiz of [true, false]) {
        const grad = horiz
          ? ctx.createLinearGradient(0, hy, w, hy)
          : ctx.createLinearGradient(cx, 0, cx, h)
        const hcol = c2 ?? c1
        const hHue = (hueShift + 30) % 360
        if (hcol) {
          grad.addColorStop(0, hexToRgba(hcol, 0))
          grad.addColorStop(0.5, hexToRgba(hcol, (0.28 + bassAvg * 0.42) * gridIntensity))
          grad.addColorStop(1, hexToRgba(hcol, 0))
        } else {
          grad.addColorStop(0, `hsla(${hHue}, 100%, 65%, 0)`)
          grad.addColorStop(0.5, `hsla(${hHue}, 100%, 65%, ${(0.25 + bassAvg * 0.38) * gridIntensity})`)
          grad.addColorStop(1, `hsla(${hHue}, 100%, 65%, 0)`)
        }
        ctx.beginPath()
        if (horiz) { ctx.moveTo(0, hy); ctx.lineTo(w, hy) }
        else { ctx.moveTo(cx, 0); ctx.lineTo(cx, h) }
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5 + bassAvg * 2.5
        ctx.shadowBlur = 10 + bassAvg * 25
        ctx.shadowColor = hcol ? hexToRgba(hcol, 0.8) : `hsla(${hHue}, 100%, 70%, 0.7)`
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── Beat detection → orb spawn ────────────────────────────────────────────────
      // Derivative approach: fire when the raw bass *rises* sharply this frame.
      // prevBassSmooth lags behind bassRaw so any sudden rise produces a large delta.
      const beatDelta = Math.max(0, bassRaw - prevBassSmooth)
      prevBassSmooth = prevBassSmooth * 0.80 + bassRaw * 0.20
      if (beatCooldown > 0) beatCooldown--

      if (beatDelta > 0.045 && bassRaw > 0.08 && beatCooldown === 0 && orbs.length < 10) {
        const count = beatDelta > 0.14 ? 3 : beatDelta > 0.08 ? 2 : 1
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          orbs.push({
            tx: 0.5 + Math.cos(angle) * (0.28 + Math.random() * 0.38),
            ty: 0.5 + Math.sin(angle) * (0.28 + Math.random() * 0.38),
            t: 0,
            speed: 0.008 + Math.random() * 0.010,
          })
        }
        beatCooldown = 12
      }

      // ── Flying orbs — hard edges, single accent color ─────────────────────────────
      const orbColor = c2 ?? c1  // always accent color
      const orbHue = (hueShift + 60) % 360

      for (let i = orbs.length - 1; i >= 0; i--) {
        const orb = orbs[i]
        orb.t += orb.speed * (1 + bassAvg * 2.0)
        if (orb.t >= 1) { orbs.splice(i, 1); continue }

        const sx = cx + (orb.tx * w - cx) * orb.t
        const sy = hy + (orb.ty * h - hy) * orb.t
        const r = 4 + orb.t * orb.t * 90

        // Quick fade-in, sustained, then sharp fade-out
        const alpha = Math.min(orb.t / 0.08, 1) * Math.pow(1 - orb.t, 1.8)
        if (alpha < 0.01) continue

        // Hard-edged solid circle — no radial gradient
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = orbColor
          ? hexToRgba(orbColor, alpha * 0.90)
          : `hsla(${orbHue}, 100%, 65%, ${alpha * 0.85})`
        ctx.shadowBlur = 18 + (1 - orb.t) * 16
        ctx.shadowColor = orbColor
          ? hexToRgba(orbColor, alpha)
          : `hsla(${orbHue}, 100%, 80%, ${alpha})`
        ctx.fill()

        // Crisp bright ring on the edge
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.strokeStyle = orbColor
          ? hexToRgba(orbColor, alpha * 1.0)
          : `hsla(${orbHue}, 100%, 88%, ${alpha})`
        ctx.lineWidth = 1.5
        ctx.shadowBlur = 0
        ctx.stroke()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}


