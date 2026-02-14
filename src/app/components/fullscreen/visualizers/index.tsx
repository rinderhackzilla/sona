import { FrequencyCircle } from './frequency-circle'
import { RadialSpectrum } from './radial-spectrum'
import { WaveformTunnel } from './waveform-tunnel'
import type { VisualizerPreset } from '@/types/visualizer'

export const VISUALIZERS = {
  'frequency-circle': FrequencyCircle,
  'radial-spectrum': RadialSpectrum,
  'waveform-tunnel': WaveformTunnel,
} as const

export const VISUALIZER_NAMES: Record<VisualizerPreset, string> = {
  'frequency-circle': 'Frequency Circle',
  'radial-spectrum': 'Radial Spectrum',
  'waveform-tunnel': 'Waveform Tunnel',
}

export type VisualizerComponent = typeof VISUALIZERS[keyof typeof VISUALIZERS]
