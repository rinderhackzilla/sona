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
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent')
    .trim()
  const [h, s, l] = v.split(' ')
  return { h: h ?? '220', s: s ?? '80%', l: l ?? '60%' }
}

// PLASMA v3: transparent canvas, 6 layers, energy-scaled distortion, 3 rotation axes.
// At silence: near-perfect circles. At full audio: violent blob interference patterns.
export function GeometricMandala() {
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

    const TWO_PI = Math.PI * 2
    const GAIN = 5.5 // higher tanh gain → more dramatic distortion per frequency unit

    let rot1 = 0 // main forward rotation
    let rot2 = 0 // counter-rotation (inner layers)
    let rot3 = 0 // high-freq driven independent axis
    let hueShift = 0
    let beatPulse = 0 // 0..1, decays after each beat
    let prevBassSmooth = 0

    let animId: number

    const drawSymmetric = (
      cx: number,
      cy: number,
      baseR: number,
      maxOff: number,
      freqOff: number,
      rot: number,
      symmetry: number,
      pts: number,
      color: string | null,
      fillAlpha: number,
      strokeAlpha: number,
      glow: number,
      fallHue: number,
    ) => {
      for (let sym = 0; sym < symmetry; sym++) {
        const symOff = (sym / symmetry) * TWO_PI

        const bx: number[] = []
        const by: number[] = []
        for (let i = 0; i < pts; i++) {
          const angle = (i / pts) * TWO_PI + rot + symOff
          const freqIdx = Math.floor(((i / pts + freqOff) % 1) * (BUF / 4))
          const raw = smoothed[Math.max(0, Math.min(BUF - 1, freqIdx))] / 255
          const fv = Math.tanh(raw * GAIN)
          const undulate =
            Math.sin(i * 0.33 + rot * 2.5) * baseR * 0.06 +
            Math.sin(i * 0.71 + rot * 5.0) * baseR * 0.025 +
            Math.sin(i * 1.4 - rot * 3.0) * baseR * 0.012
          const r = baseR * (1 + beatPulse * 0.22) + fv * maxOff + undulate
          bx.push(cx + Math.cos(angle) * r)
          by.push(cy + Math.sin(angle) * r)
        }

        ctx.beginPath()
        ctx.moveTo((bx[pts - 1] + bx[0]) / 2, (by[pts - 1] + by[0]) / 2)
        for (let i = 0; i < pts; i++) {
          const ni = (i + 1) % pts
          ctx.quadraticCurveTo(
            bx[i],
            by[i],
            (bx[i] + bx[ni]) / 2,
            (by[i] + by[ni]) / 2,
          )
        }
        ctx.closePath()

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR + maxOff)
        const hue = (fallHue + sym * (360 / symmetry) * 0.35) % 360
        if (color) {
          grad.addColorStop(0, hexToRgba(color, Math.min(1, fillAlpha * 1.7)))
          grad.addColorStop(0.45, hexToRgba(color, fillAlpha))
          grad.addColorStop(1, hexToRgba(color, 0))
        } else {
          grad.addColorStop(
            0,
            `hsla(${hue}, 100%, 72%, ${Math.min(1, fillAlpha * 1.7)})`,
          )
          grad.addColorStop(0.45, `hsla(${hue}, 90%, 58%, ${fillAlpha})`)
          grad.addColorStop(1, `hsla(${hue}, 90%, 58%, 0)`)
        }

        const glowMult = 1 + beatPulse * 1.0
        ctx.fillStyle = grad
        ctx.shadowBlur = glow * glowMult
        ctx.shadowColor = color
          ? hexToRgba(color, 0.8)
          : `hsla(${hue}, 100%, 65%, 0.75)`
        ctx.fill()

        ctx.strokeStyle = color
          ? hexToRgba(color, Math.min(1, strokeAlpha * (1 + beatPulse * 0.7)))
          : `hsla(${hue}, 100%, 80%, ${Math.min(1, strokeAlpha * (1 + beatPulse * 0.7))})`
        ctx.lineWidth = 0.8 + beatPulse * 1.8
        ctx.shadowBlur = glow * 0.5 * glowMult
        ctx.stroke()
      }
    }

    const draw = () => {
      const analyser = getGlobalAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(freqBuf)
        for (let i = 0; i < BUF; i++) {
          smoothed[i] = smoothed[i] * 0.74 + freqBuf[i] * 0.26
        }
      }

      scheduleStableResize()

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w / 2
      const cy = h / 2
      const size = Math.min(w, h)
      const palette = paletteRef.current
      const c1 = palette?.vibrant ?? null
      const c2 = palette?.accent ?? null
      const c3 = palette?.dominant ?? null
      const { h: ah } = accentHSL()

      // Energy bands
      let bassSum = 0
      let midSum = 0
      let highSum = 0
      for (let i = 0; i < 6; i++) bassSum += smoothed[i]
      for (let i = 6; i < 40; i++) midSum += smoothed[i]
      for (let i = 40; i < 90; i++) highSum += smoothed[i]
      const bassAvg = bassSum / 6 / 255
      const midAvg = midSum / 34 / 255
      const highAvg = highSum / 50 / 255

      // Raw bass for beat detection
      let bassRawSum = 0
      for (let i = 0; i < 6; i++) bassRawSum += freqBuf[i]
      const bassRaw = bassRawSum / 6 / 255

      // Beat detection: rising-edge derivative on raw bass
      const beatDelta = Math.max(0, bassRaw - prevBassSmooth)
      prevBassSmooth = prevBassSmooth * 0.8 + bassRaw * 0.2
      if (beatDelta > 0.04) beatPulse = Math.min(1, beatPulse + beatDelta * 2.5)
      beatPulse *= 0.84 // faster decay → punchier beat flashes

      // 3 independent rotation axes, all energy-reactive
      rot1 += 0.008 + midAvg * 0.016 + highAvg * 0.01
      rot2 -= 0.01 + bassAvg * 0.014 + midAvg * 0.007
      rot3 += 0.005 + highAvg * 0.028 // almost entirely high-freq driven

      // Hue drifts faster
      hueShift = (hueShift + 1.2 + midAvg * 5.0 + highAvg * 2.0) % 360
      const baseHue = (parseInt(ah) + hueShift) % 360

      // Energy scale: 0.3 at silence → near-circles; ~2.5 at full audio → violent blobs
      const energyScale = 0.3 + bassAvg * 0.7 + midAvg * 1.0 + highAvg * 0.5

      // Transparent canvas — no background, album art shows through
      ctx.clearRect(0, 0, w, h)

      // ── Layer 1: outer corona — 2-fold, slowest rotation
      drawSymmetric(
        cx,
        cy,
        size * 0.26,
        size * 0.16 * energyScale,
        0.0,
        rot1 * 0.45,
        2,
        80,
        c3,
        0.2,
        0.35,
        24,
        (baseHue + 15) % 360,
      )

      // ── Layer 2: main plasma — 4-fold symmetry, forward rotation
      drawSymmetric(
        cx,
        cy,
        size * 0.19,
        size * 0.15 * energyScale,
        0.18,
        rot1,
        4,
        88,
        c1,
        0.32,
        0.6,
        36,
        baseHue,
      )

      // ── Layer 3: counter-plasma — 4-fold, COUNTER rotation
      drawSymmetric(
        cx,
        cy,
        size * 0.14,
        size * 0.12 * energyScale,
        0.42,
        rot2,
        4,
        80,
        c2,
        0.42,
        0.72,
        42,
        (baseHue + 130) % 360,
      )

      // ── Layer 4: inner mandala — 6-fold hexagonal, fast forward rotation
      drawSymmetric(
        cx,
        cy,
        size * 0.08,
        size * 0.08 * energyScale,
        0.65,
        rot1 * 2.4,
        6,
        64,
        c1,
        0.62,
        0.88,
        48,
        (baseHue + 60) % 360,
      )

      // ── Layer 5: high-freq reactive — 8-fold, driven almost entirely by highs
      drawSymmetric(
        cx,
        cy,
        size * 0.055,
        size * 0.07 * (0.15 + highAvg * 2.2),
        0.75,
        rot3 * 3.5,
        8,
        56,
        c2,
        0.75,
        0.95,
        52,
        (baseHue + 200) % 360,
      )

      // ── Layer 6: innermost accent — 6-fold, counter-rotates fast
      drawSymmetric(
        cx,
        cy,
        size * 0.032,
        size * 0.04 * energyScale,
        0.82,
        rot2 * 2.5,
        6,
        40,
        c2,
        0.75,
        0.95,
        52,
        (baseHue + 260) % 360,
      )

      ctx.shadowBlur = 0

      // ── Central orb: pulses hard on beats ─────────────────────────────────────────
      const orbR = size * (0.03 + bassAvg * 0.03 + beatPulse * 0.042)
      const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 3)
      if (c1) {
        orbGrad.addColorStop(0, hexToRgba(c1, 0.97))
        orbGrad.addColorStop(0.25, hexToRgba(c1, 0.65 + beatPulse * 0.3))
        orbGrad.addColorStop(0.6, hexToRgba(c1, 0.22))
        orbGrad.addColorStop(1, hexToRgba(c1, 0))
      } else {
        orbGrad.addColorStop(0, `hsla(${baseHue}, 100%, 92%, 0.97)`)
        orbGrad.addColorStop(
          0.3,
          `hsla(${baseHue}, 100%, 65%, ${0.6 + beatPulse * 0.3})`,
        )
        orbGrad.addColorStop(1, `hsla(${baseHue}, 100%, 65%, 0)`)
      }
      ctx.beginPath()
      ctx.arc(cx, cy, orbR * 3, 0, TWO_PI)
      ctx.fillStyle = orbGrad
      ctx.shadowBlur = 26 + beatPulse * 48 + bassAvg * 22
      ctx.shadowColor = c2
        ? hexToRgba(c2, 0.9)
        : `hsla(${(baseHue + 40) % 360}, 100%, 70%, 0.85)`
      ctx.fill()
      ctx.shadowBlur = 0

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}
