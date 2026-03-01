import type { IAudioContext, IBiquadFilterNode } from 'standardized-audio-context'
import { safeStorageGet, safeStorageSet } from '@/utils/safe-storage'

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

const EQ_STORAGE_KEY = 'sona.eq.state'

type PersistedEqState = {
  enabled: boolean
  gains: number[]
}

let eqFilters: IBiquadFilterNode<IAudioContext>[] = []
let eqEnabled = false
let eqGains: number[] = [0, 0, 0, 0, 0, 0, 0, 0]

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

function loadPersistedEqState(): PersistedEqState | null {
  try {
    const raw = safeStorageGet(EQ_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedEqState>
    return {
      enabled: Boolean(parsed.enabled),
      gains: normalizeEqGains(parsed.gains),
    }
  } catch {
    return null
  }
}

function persistEqState() {
  const payload: PersistedEqState = {
    enabled: eqEnabled,
    gains: normalizeEqGains(eqGains),
  }

  try {
    safeStorageSet(EQ_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // keep audio chain resilient on storage failure
  }
}

const persistedEqState = loadPersistedEqState()
if (persistedEqState) {
  eqEnabled = persistedEqState.enabled
  eqGains = persistedEqState.gains
}

export function getEqEnabled() {
  return eqEnabled
}

export function getEqGains() {
  return eqGains
}

export function getEqFilters() {
  return eqFilters
}

export function setEqFilters(filters: IBiquadFilterNode<IAudioContext>[]) {
  eqFilters = filters
}

export function setEqEnabledState(enabled: boolean) {
  eqEnabled = enabled
  if (!enabled) {
    eqFilters.forEach((filter) => {
      filter.gain.value = 0
    })
  } else {
    eqGains = normalizeEqGains(eqGains)
    eqFilters.forEach((filter, index) => {
      filter.gain.value = eqGains[index]
    })
  }
  persistEqState()
}

export function setEqGainsState(gains: number[]) {
  eqGains = normalizeEqGains(gains)
  if (eqEnabled && eqFilters.length) {
    eqFilters.forEach((filter, index) => {
      filter.gain.value = eqGains[index]
    })
  }
  persistEqState()
}
