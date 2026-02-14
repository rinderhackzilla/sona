import { FrequencyCircle } from './frequency-circle'
import { RadialSpectrum } from './radial-spectrum'
import { WaveformTunnel } from './waveform-tunnel'
import { BassReactor } from './bass-reactor'
import { FrequencySpiral } from './frequency-spiral'
import type { VisualizerPreset } from '@/types/visualizer'

export const VISUALIZERS = {
  'frequency-circle': FrequencyCircle,
  'radial-spectrum': RadialSpectrum,
  'waveform-tunnel': WaveformTunnel,
  'bass-reactor': BassReactor,
  'frequency-spiral': FrequencySpiral,
} as const

export const VISUALIZER_NAMES: Record<VisualizerPreset, string> = {
  'frequency-circle': 'Frequency Circle',
  'radial-spectrum': 'Radial Spectrum',
  'waveform-tunnel': 'Waveform Tunnel',
  'bass-reactor': 'Bass Reactor',
  'frequency-spiral': 'Frequency Spiral',
}

export type VisualizerComponent = typeof VISUALIZERS[keyof typeof VISUALIZERS]
