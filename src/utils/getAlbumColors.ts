import { FastAverageColor } from 'fast-average-color'

export interface AlbumColorPalette {
  dominant: string // Main dominant color (hex)
  vibrant: string // Most vibrant/saturated color (hex)
  muted: string // Muted/desaturated color (hex)
  accent: string // Complementary accent color (hex)
}

/**
 * Extract 4 distinct colors from album cover image
 * @param img - HTMLImageElement of the album cover
 * @returns Promise<AlbumColorPalette> - Object with 4 colors in hex format
 */
export async function getAlbumColorPalette(
  img: HTMLImageElement | null,
): Promise<AlbumColorPalette | null> {
  if (!img) return null

  const fac = new FastAverageColor()

  try {
    // Create canvas to analyze image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data

    // Collect color samples
    const colors: Array<{ r: number; g: number; b: number; count: number }> = []
    const colorMap = new Map<string, number>()

    // Sample every 10th pixel for performance
    for (let i = 0; i < pixels.length; i += 40) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const a = pixels[i + 3]

      if (a < 128) continue // Skip transparent

      // Skip very dark and very light colors (more aggressive)
      const brightness = (r + g + b) / 3
      if (brightness < 30 || brightness > 220) continue

      // Quantize colors to reduce variations
      const qr = Math.round(r / 20) * 20
      const qg = Math.round(g / 20) * 20
      const qb = Math.round(b / 20) * 20

      const key = `${qr},${qg},${qb}`
      colorMap.set(key, (colorMap.get(key) || 0) + 1)
    }

    // Convert map to array and sort by frequency
    colorMap.forEach((count, key) => {
      const [r, g, b] = key.split(',').map(Number)
      colors.push({ r, g, b, count })
    })

    colors.sort((a, b) => b.count - a.count)

    if (colors.length === 0) {
      // Fallback to fast-average-color dominant
      const fallback = await fac.getColorAsync(img, {
        mode: 'precision',
        algorithm: 'dominant',
      })
      const hex = fallback.hex
      return {
        dominant: hex,
        vibrant: hex,
        muted: hex,
        accent: hex,
      }
    }

    // 1. Dominant: Most frequent color (but boosted saturation)
    const dominantColor = colors[0]
    const dominant = boostSaturation(
      dominantColor.r,
      dominantColor.g,
      dominantColor.b,
      1.2,
    )

    // 2. Vibrant: Highest saturation (boosted more)
    const vibrant = findMostVibrant(colors, 1.3)

    // 3. Muted: Lowest saturation but not too dark/light
    const muted = findMostMuted(colors)

    // 4. Accent: Complementary to vibrant (not dominant)
    const vibrantRgb = hexToRgb(vibrant)
    const accent = getComplementaryColor(vibrantRgb)

    return {
      dominant,
      vibrant,
      muted,
      accent,
    }
  } catch (error) {
    console.error('Color extraction failed:', error)
    return null
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): {
  h: number
  s: number
  l: number
} {
  r /= 255
  g /= 255
  b /= 255

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

  return { h: h * 360, s, l }
}

function boostSaturation(
  r: number,
  g: number,
  b: number,
  factor: number,
): string {
  const { h, s, l } = rgbToHsl(r, g, b)
  const boostedS = Math.min(1, s * factor)
  const { r: newR, g: newG, b: newB } = hslToRgb(h, boostedS, l)
  return rgbToHex(Math.round(newR), Math.round(newG), Math.round(newB))
}

function findMostVibrant(
  colors: Array<{ r: number; g: number; b: number; count: number }>,
  boostFactor: number = 1.0,
): string {
  let maxSaturation = 0
  let vibrant = colors[0]

  for (const color of colors) {
    const { s, l } = rgbToHsl(color.r, color.g, color.b)
    // Prefer colors with good lightness
    if (l > 0.3 && l < 0.7 && s > maxSaturation) {
      maxSaturation = s
      vibrant = color
    }
  }

  return boostSaturation(vibrant.r, vibrant.g, vibrant.b, boostFactor)
}

function findMostMuted(
  colors: Array<{ r: number; g: number; b: number; count: number }>,
): string {
  let minSaturation = 1
  let muted = colors[0]

  for (const color of colors) {
    const { s, l } = rgbToHsl(color.r, color.g, color.b)
    // Avoid very dark or very light colors
    if (l > 0.3 && l < 0.7 && s < minSaturation) {
      minSaturation = s
      muted = color
    }
  }

  return rgbToHex(muted.r, muted.g, muted.b)
}

function getComplementaryColor(color: {
  r: number
  g: number
  b: number
}): string {
  const { h, s, l } = rgbToHsl(color.r, color.g, color.b)
  const complementaryH = (h + 180) % 360

  // Boost saturation for accent
  const boostedS = Math.min(1, s * 1.2)

  // Convert back to RGB
  const { r, g, b } = hslToRgb(complementaryH, boostedS, l)
  return rgbToHex(Math.round(r), Math.round(g), Math.round(b))
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  h /= 360
  let r: number
  let g: number
  let b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: r * 255,
    g: g * 255,
    b: b * 255,
  }
}
