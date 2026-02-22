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

// Psychedelic zoom vortex: frequency-distorted rings continuously fly toward the viewer.
// Bass drives speed and rotation, making it react violently to the beat.
export function CircularWaveform() {
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

    const N = 22
    // Each ring has a progress value 0..1 (0 = tiny/far, 1 = full-screen/close)
    const progress = new Float32Array(N)
    for (let i = 0; i < N; i++) progress[i] = i / N

    let baseRotation = 0
    const TWO_PI = Math.PI * 2
    const POINTS = 72
    let animId: number

    const draw = () => {
      const analyser = getGlobalAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(freqBuf)
        for (let i = 0; i < BUF; i++) {
          smoothed[i] = smoothed[i] * 0.78 + freqBuf[i] * 0.22
        }
      }

      scheduleStableResize()

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const cx = w / 2
      const cy = h / 2
      const maxR = Math.min(w, h) * 0.54
      const palette = paletteRef.current
      const c1 = palette?.vibrant ?? null
      const c2 = palette?.accent ?? null
      const c3 = palette?.dominant ?? null
      const { h: ah, s: as_, l: al } = accentHSL()

      // Bass & mid energy
      let bassSum = 0
      for (let i = 0; i < 8; i++) bassSum += smoothed[i]
      const bassAvg = bassSum / 8 / 255

      let midSum = 0
      for (let i = 15; i < 50; i++) midSum += smoothed[i]
      const midAvg = midSum / 35 / 255

      ctx.clearRect(0, 0, w, h)

      // Speed: base + heavy bass kick
      const speed = 0.006 + bassAvg * 0.022 + midAvg * 0.008
      // Rotation: also bass-driven
      baseRotation += 0.012 + bassAvg * 0.035

      // Advance all rings
      for (let i = 0; i < N; i++) {
        progress[i] += speed
        if (progress[i] > 1) progress[i] -= 1
      }

      // Draw order: smallest (farthest) first
      const order = Array.from({ length: N }, (_, i) => i)
        .sort((a, b) => progress[a] - progress[b])

      for (const idx of order) {
        const p = progress[idx]

        // Dramatic perspective ease — rings accelerate as they approach
        const scale = Math.pow(p, 1.6)
        const baseR = maxR * scale
        if (baseR < 1.5) continue

        // Each ring rotates proportionally to how close it is (parallax)
        const angleOffset = baseRotation * (0.5 + p * 1.8)

        // Distortion amount grows with proximity
        const distMult = 0.28 + p * 0.22

        // Build distorted ring path
        ctx.beginPath()
        for (let i = 0; i <= POINTS; i++) {
          const angle = (i / POINTS) * TWO_PI + angleOffset
          // Map angle position to a frequency bin
          const freqIdx = Math.floor(((i / POINTS) * 0.55) * (BUF / 2))
          const fv = smoothed[Math.min(freqIdx, BUF / 2 - 1)] / 255
          const r = baseR * (1 + fv * distMult)
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()

        // Alpha: fades in from center, full opacity near edge, then fades just before clipping
        const alpha = Math.pow(p, 0.5) * (p < 0.9 ? 1 : (1 - p) / 0.1) * 0.80

        // Color: cycle through palette based on ring position
        // Creates a color depth illusion (far = one color, close = another)
        let color: string | null
        const band = Math.floor(p * 3)
        if (band === 0) color = c3 ?? c2 ?? c1
        else if (band === 1) color = c2 ?? c1
        else color = c1

        const glowStrength = p * (0.4 + bassAvg * 0.6)
        ctx.shadowBlur = 6 + glowStrength * 18
        ctx.shadowColor = color
          ? hexToRgba(color, glowStrength * 0.75)
          : `hsla(${ah}, ${as_}, ${al}, ${glowStrength * 0.65})`
        ctx.strokeStyle = color
          ? hexToRgba(color, alpha)
          : `hsla(${ah}, ${as_}, ${al}, ${alpha})`
        ctx.lineWidth = 0.5 + p * 2.8
        ctx.stroke()
      }

      ctx.shadowBlur = 0

      // Vanishing point glow at center (draws the eye in)
      const vpGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.18)
      if (c1) {
        vpGrad.addColorStop(0, hexToRgba(c1, 0.25 + bassAvg * 0.35))
        vpGrad.addColorStop(0.5, hexToRgba(c1, 0.06))
        vpGrad.addColorStop(1, hexToRgba(c1, 0))
      } else {
        vpGrad.addColorStop(0, `hsla(${ah}, ${as_}, ${al}, ${0.2 + bassAvg * 0.3})`)
        vpGrad.addColorStop(1, `hsla(${ah}, ${as_}, ${al}, 0)`)
      }
      ctx.beginPath()
      ctx.arc(cx, cy, maxR * 0.18, 0, TWO_PI)
      ctx.fillStyle = vpGrad
      ctx.fill()

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}


