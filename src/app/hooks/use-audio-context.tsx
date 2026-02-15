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

// Global analyser for visualizer
let globalAnalyser: AnalyserNode | null = null

export function useAudioContext(audio: HTMLAudioElement | null) {
  const { isSong } = usePlayerMediaType()
  const { replayGainError, replayGainEnabled } = useReplayGainState()

  const audioContextRef = useRef<IAudioContext | null>(null)
  const sourceNodeRef = useRef<IAudioSource | null>(null)
  const gainNodeRef = useRef<IGainNode<IAudioContext> | null>(null)
  const visualizerGainRef = useRef<GainNode | null>(null)
  const eqFiltersRef = useRef<IBiquadFilterNode<IAudioContext>[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)

  const setupAudioContext = useCallback(() => {
    if (!audio || !isSong || replayGainError) return

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    const audioContext = audioContextRef.current

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = audioContext.createMediaElementSource(audio)
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

    // Create analyser for visualizer
    if (!analyserRef.current && !globalAnalyser) {
      const analyser = audioContext.createAnalyser() as AnalyserNode
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.75
      analyserRef.current = analyser
      globalAnalyser = analyser
      logger.info('[AudioContext] Created analyser for visualizer')
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
      logger.info('Created EQ filters', { count: filters.length })
    }

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

    logger.info('Audio chain connected: source -> EQ -> gain -> destination (+ visualizer branch)')
  }, [audio, isSong, replayGainError])

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
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }
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
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  useEffect(() => {
    if (replayGainError) resetRefs()
  }, [replayGainError, resetRefs])

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
    globalEqFilters.forEach((filter, index) => {
      filter.gain.value = globalEqGains[index]
    })
  }
}

export function setEqGains(gains: number[]) {
  globalEqGains = gains
  
  if (globalEqEnabled && globalEqFilters.length) {
    globalEqFilters.forEach((filter, index) => {
      filter.gain.value = gains[index]
      logger.info(`EQ Filter ${index}: ${gains[index]} dB`)
    })
  }
}

export function getEqState() {
  return {
    enabled: globalEqEnabled,
    gains: globalEqGains,
    filters: globalEqFilters,
  }
}
