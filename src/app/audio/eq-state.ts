import type {
  IAudioContext,
  IBiquadFilterNode,
} from 'standardized-audio-context'

export const EQ_BANDS = [
  { hz: 32, type: 'lowshelf' as BiquadFilterType },
  { hz: 64, type: 'peaking' as BiquadFilterType },
  { hz: 125, type: 'peaking' as BiquadFilterType },
  { hz: 250, type: 'peaking' as BiquadFilterType },
  { hz: 500, type: 'peaking' as BiquadFilterType },
  { hz: 1000, type: 'peaking' as BiquadFilterType },
  { hz: 2000, type: 'peaking' as BiquadFilterType },
  { hz: 4000, type: 'highshelf' as BiquadFilterType },
]

// Runtime singleton that mirrors the currently wired AudioContext EQ nodes.
// Callers must ensure setupAudioContext() has run for the active context before
// reading/writing these references, otherwise stale filter refs are possible.
let eqFilters: IBiquadFilterNode<IAudioContext>[] = []

function clampEqGain(value: number) {
  return Math.max(-12, Math.min(12, Math.round(value)))
}

export function normalizeEqGains(gains: unknown): number[] {
  if (!Array.isArray(gains)) return [0, 0, 0, 0, 0, 0, 0, 0]

  const normalized = gains
    .map((value) => (typeof value === 'number' ? clampEqGain(value) : 0))
    .slice(0, EQ_BANDS.length)

  while (normalized.length < EQ_BANDS.length) normalized.push(0)
  return normalized
}

export function getEqFilters() {
  return eqFilters
}

export function setEqFilters(filters: IBiquadFilterNode<IAudioContext>[]) {
  eqFilters = filters
}
