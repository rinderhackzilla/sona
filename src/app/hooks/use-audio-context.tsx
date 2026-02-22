import { useCallback, useEffect, useRef } from 'react'
import {
  AudioContext,
  type IAudioContext,
  type IGainNode,
  type IMediaElementAudioSourceNode,
  type IBiquadFilterNode,
} from 'standardized-audio-context'
import { usePlayerMediaType, useReplayGainState } from '@/store/player.store'
import { logger } from '@/utils/logger'
import { ReplayGainParams } from '@/utils/replayGain'

type IAudioSource = IMediaElementAudioSourceNode<IAudioContext>

// EQ Filter configuration
const EQ_BANDS = [
  { hz: 32, type: 'lowshelf' as BiquadFilterType },
  { hz: 64, type: 'peaking' as BiquadFilterType },
  { hz: 125, type: 'peaking' as BiquadFilterType },
  { hz: 250, type: 'peaking' as BiquadFilterType },
  { hz: 500, type: 'peaking' as BiquadFilterType },
  { hz: 1000, type: 'peaking' as BiquadFilterType },
  { hz: 2000, type: 'peaking' as BiquadFilterType },
  { hz: 4000, type: 'highshelf' as BiquadFilterType },
]

// Global EQ state shared across app
let globalEqFilters: IBiquadFilterNode<IAudioContext>[] = []
let globalEqEnabled = false
let globalEqGains: number[] = [0, 0, 0, 0, 0, 0, 0, 0]
const EQ_STORAGE_KEY = 'sona.eq.state'

type PersistedEqState = {
  enabled: boolean
  gains: number[]
}

function clampEqGain(value: number) {
  return Math.max(-12, Math.min(12, Math.round(value)))
}

function normalizeEqGains(gains: unknown): number[] {
  if (!Array.isArray(gains)) return [0, 0, 0, 0, 0, 0, 0, 0]

  const normalized = gains
    .map((value) => (typeof value === 'number' ? clampEqGain(value) : 0))
    .slice(0, EQ_BANDS.length)

  while (normalized.length < EQ_BANDS.length) {
    normalized.push(0)
  }

  return normalized
}

function loadPersistedEqState(): PersistedEqState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(EQ_STORAGE_KEY)
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
  if (typeof window === 'undefined') return

  const payload: PersistedEqState = {
    enabled: globalEqEnabled,
    gains: normalizeEqGains(globalEqGains),
  }

  try {
    window.localStorage.setItem(EQ_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures to keep audio pipeline resilient.
  }
}

const persistedEqState = loadPersistedEqState()
if (persistedEqState) {
  globalEqEnabled = persistedEqState.enabled
  globalEqGains = persistedEqState.gains
}

// Global analyser for visualizer
let globalAnalyser: AnalyserNode | null = null
let globalAudioContext: IAudioContext | null = null
const globalMediaSourceNodes = new WeakMap<HTMLAudioElement, IAudioSource>()

export function useAudioContext(audio: HTMLAudioElement | null) {
  const { isSong } = usePlayerMediaType()
  const { replayGainEnabled } = useReplayGainState()

  const audioContextRef = useRef<IAudioContext | null>(null)
  const sourceNodeRef = useRef<IAudioSource | null>(null)
  const gainNodeRef = useRef<IGainNode<IAudioContext> | null>(null)
  const visualizerGainRef = useRef<GainNode | null>(null)
  const eqFiltersRef = useRef<IBiquadFilterNode<IAudioContext>[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const chainConnectedRef = useRef(false)

  const setupAudioContext = useCallback(() => {
    if (!audio || !isSong) return

    if (!globalAudioContext) {
      globalAudioContext = new AudioContext()
    }
    if (!audioContextRef.current) {
      audioContextRef.current = globalAudioContext
    }

    const audioContext = audioContextRef.current

    if (!sourceNodeRef.current) {
      const existingSource = globalMediaSourceNodes.get(audio)
      if (existingSource) {
        sourceNodeRef.current = existingSource
      } else {
        const nextSource = audioContext.createMediaElementSource(audio)
        globalMediaSourceNodes.set(audio, nextSource)
        sourceNodeRef.current = nextSource
      }
    }

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain()
    }

    // Create visualizer-specific gain node (fixed at 25% for consistent visualization)
    if (!visualizerGainRef.current) {
      const vizGain = audioContext.createGain() as GainNode
      vizGain.gain.value = 0.25 // Fixed 25% volume for visualizer
      visualizerGainRef.current = vizGain
      logger.info('[AudioContext] Created visualizer gain node at 25%')
    }

    // Reuse existing global analyser when available to keep visualizer chain alive
    if (!analyserRef.current) {
      if (globalAnalyser) {
        analyserRef.current = globalAnalyser
      } else {
        const analyser = audioContext.createAnalyser() as AnalyserNode
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.75
        analyserRef.current = analyser
        globalAnalyser = analyser
        logger.info('[AudioContext] Created analyser for visualizer')
      }
    }

    // Create EQ filters if not already created
    if (eqFiltersRef.current.length === 0) {
      const filters = EQ_BANDS.map((band) => {
        const filter = audioContext.createBiquadFilter()
        filter.type = band.type
        filter.frequency.value = band.hz
        filter.Q.value = 1.0
        filter.gain.value = 0
        return filter
      })
      eqFiltersRef.current = filters
      globalEqFilters = filters
      const initialGains = normalizeEqGains(globalEqGains)
      globalEqGains = initialGains
      filters.forEach((filter, index) => {
        filter.gain.value = globalEqEnabled ? initialGains[index] : 0
      })
      logger.info('Created EQ filters', { count: filters.length })
    }

    if (!chainConnectedRef.current) {
      // Connect main audio chain: source -> EQ filters -> gainNode -> destination
      let prevNode: AudioNode = sourceNodeRef.current

      // Connect all EQ filters in series
      eqFiltersRef.current.forEach((filter) => {
        prevNode.connect(filter)
        prevNode = filter
      })

      // Connect to main gain node (for master volume)
      prevNode.connect(gainNodeRef.current)

      // Connect gain node to destination
      gainNodeRef.current.connect(audioContext.destination)

      // Separate visualizer chain: last EQ filter -> visualizer gain -> analyser
      // This splits off BEFORE the master gain node
      const lastEqFilter = eqFiltersRef.current[eqFiltersRef.current.length - 1]
      if (lastEqFilter && visualizerGainRef.current && analyserRef.current) {
        lastEqFilter.connect(visualizerGainRef.current)
        visualizerGainRef.current.connect(analyserRef.current)
        logger.info('Visualizer chain connected: EQ -> visualizer gain (25%) -> analyser')
      }

      chainConnectedRef.current = true
      logger.info(
        'Audio chain connected: source -> EQ -> gain -> destination (+ visualizer branch)',
      )
    }
  }, [audio, isSong])

  const resumeContext = useCallback(async () => {
    const audioContext = audioContextRef.current
    if (!audioContext || !isSong) return

    logger.info('AudioContext State', { state: audioContext.state })

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }
    if (audioContext.state === 'closed') {
      setupAudioContext()
    }
  }, [isSong, setupAudioContext])

  const setupGain = useCallback(
    (gainValue: number, replayGain?: ReplayGainParams) => {
      if (audioContextRef.current && gainNodeRef.current) {
        const currentTime = audioContextRef.current.currentTime

        logger.info('Replay Gain Status', {
          enabled: replayGainEnabled,
          gainValue,
          ...replayGain,
        })

        // Only update master gain, NOT visualizer gain
        gainNodeRef.current.gain.setValueAtTime(gainValue, currentTime)
      }
    },
    [replayGainEnabled],
  )

  const resetRefs = useCallback(() => {
    sourceNodeRef.current = null
    if (visualizerGainRef.current) {
      visualizerGainRef.current.disconnect()
      visualizerGainRef.current = null
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
      globalAnalyser = null
    }
    eqFiltersRef.current.forEach(filter => {
      filter.disconnect()
    })
    eqFiltersRef.current = []
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect()
      gainNodeRef.current = null
    }
    audioContextRef.current = globalAudioContext
    chainConnectedRef.current = false
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: clear state after unmount
  useEffect(() => {
    return () => resetRefs()
  }, [])

  useEffect(() => {
    if (audio) setupAudioContext()
  }, [audio, setupAudioContext])

  return {
    audioContextRef,
    sourceNodeRef,
    gainNodeRef,
    eqFiltersRef,
    analyserRef,
    setupAudioContext,
    resumeContext,
    setupGain,
    resetRefs,
  }
}

// Export function to get global analyser for visualizer
export function getGlobalAnalyser(): AnalyserNode | null {
  return globalAnalyser
}

// Export functions to control EQ from equalizer modal
export function setEqEnabled(enabled: boolean) {
  globalEqEnabled = enabled
  logger.info('EQ enabled:', enabled)
  
  if (!enabled) {
    // Bypass EQ by setting all gains to 0
    globalEqFilters.forEach(filter => {
      filter.gain.value = 0
    })
  } else {
    // Restore saved gains
    globalEqGains = normalizeEqGains(globalEqGains)
    globalEqFilters.forEach((filter, index) => {
      filter.gain.value = globalEqGains[index]
    })
  }
  persistEqState()
}

export function setEqGains(gains: number[]) {
  globalEqGains = normalizeEqGains(gains)
  
  if (globalEqEnabled && globalEqFilters.length) {
    globalEqFilters.forEach((filter, index) => {
      filter.gain.value = globalEqGains[index]
      logger.info(`EQ Filter ${index}: ${globalEqGains[index]} dB`)
    })
  }
  persistEqState()
}

export function getEqState() {
  return {
    enabled: globalEqEnabled,
    gains: globalEqGains,
    filters: globalEqFilters,
  }
}
