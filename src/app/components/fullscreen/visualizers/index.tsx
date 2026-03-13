import type { VisualizerPreset } from '@/types/visualizer'
import { AudioLandscape } from './audio-landscape'
import { CircularWaveform } from './circular-waveform'
import { FrequencyCircle } from './frequency-circle'
import { Oscilloscope } from './oscilloscope'
import { WaveformTunnel } from './waveform-tunnel'

export const VISUALIZERS: Record<VisualizerPreset, React.ComponentType> = {
  'frequency-circle': FrequencyCircle,
  'waveform-tunnel': WaveformTunnel,
  oscilloscope: Oscilloscope,
  'audio-landscape': AudioLandscape,
  'circular-waveform': CircularWaveform,
}

export const VISUALIZER_NAMES: Record<VisualizerPreset, string> = {
  'frequency-circle': 'Radial Bars',
  'waveform-tunnel': 'Mirror Spectrum',
  oscilloscope: 'Grid Rush',
  'audio-landscape': 'Aurora',
  'circular-waveform': 'Vortex',
}

export type VisualizerComponent = (typeof VISUALIZERS)[keyof typeof VISUALIZERS]
