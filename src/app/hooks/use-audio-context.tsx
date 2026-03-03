import { useCallback, useEffect, useRef } from 'react'
import {
  AudioContext,
  type IAudioContext,
  type IBiquadFilterNode,
  type IGainNode,
  type IMediaElementAudioSourceNode,
} from 'standardized-audio-context'
import {
  getGlobalAnalyserNode,
  getGlobalAudioContext,
  getGlobalMediaSourceNode,
  setGlobalAnalyserNode,
  setGlobalAudioContext,
  setGlobalMediaSourceNode,
} from '@/app/audio/context-singleton'
import {
  EQ_BANDS,
  getEqEnabled,
  getEqFilters,
  getEqGains,
  normalizeEqGains,
  setEqEnabledState,
  setEqFilters,
  setEqGainsState,
} from '@/app/audio/eq-state'
import { usePlayerMediaType, useReplayGainState } from '@/store/player.store'
import { logger } from '@/utils/logger'
import { ReplayGainParams } from '@/utils/replayGain'

type IAudioSource = IMediaElementAudioSourceNode<IAudioContext>

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

    if (!getGlobalAudioContext()) {
      setGlobalAudioContext(new AudioContext())
    }
    if (!audioContextRef.current) {
      audioContextRef.current = getGlobalAudioContext()
    }

    const audioContext = audioContextRef.current

    if (!sourceNodeRef.current) {
      const existingSource = getGlobalMediaSourceNode(audio)
      if (existingSource) {
        sourceNodeRef.current = existingSource
      } else {
        const nextSource = audioContext.createMediaElementSource(audio)
        setGlobalMediaSourceNode(audio, nextSource)
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
      const globalAnalyser = getGlobalAnalyserNode()
      if (globalAnalyser) {
        analyserRef.current = globalAnalyser
      } else {
        const analyser = audioContext.createAnalyser() as AnalyserNode
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.75
        analyserRef.current = analyser
        setGlobalAnalyserNode(analyser)
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
      setEqFilters(filters)
      const initialGains = normalizeEqGains(getEqGains())
      filters.forEach((filter, index) => {
        filter.gain.value = getEqEnabled() ? initialGains[index] : 0
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
        logger.info(
          'Visualizer chain connected: EQ -> visualizer gain (25%) -> analyser',
        )
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
      setGlobalAnalyserNode(null)
    }
    eqFiltersRef.current.forEach((filter) => {
      filter.disconnect()
    })
    eqFiltersRef.current = []
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect()
      gainNodeRef.current = null
    }
    audioContextRef.current = getGlobalAudioContext()
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
  return getGlobalAnalyserNode()
}

// Export functions to control EQ from equalizer modal
export function setEqEnabled(enabled: boolean) {
  setEqEnabledState(enabled)
  logger.info('EQ enabled:', enabled)
}

export function setEqGains(gains: number[]) {
  setEqGainsState(gains)

  if (getEqEnabled() && getEqFilters().length) {
    getEqFilters().forEach((filter, index) => {
      filter.gain.value = getEqGains()[index]
      logger.info(`EQ Filter ${index}: ${getEqGains()[index]} dB`)
    })
  }
}

export function getEqState() {
  return {
    enabled: getEqEnabled(),
    gains: getEqGains(),
    filters: getEqFilters(),
  }
}
