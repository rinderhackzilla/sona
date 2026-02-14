import { FrequencyCircle } from './frequency-circle'
import { RadialSpectrum } from './radial-spectrum'
import { WaveformTunnel } from './waveform-tunnel'
import { ParticleNebula } from './particle-nebula'
import { Oscilloscope } from './oscilloscope'
import { GeometricMandala } from './geometric-mandala'
import { AudioLandscape } from './audio-landscape'
import { CircularWaveform } from './circular-waveform'
import type { VisualizerPreset } from '@/types/visualizer'

export const VISUALIZERS = {
  'frequency-circle': FrequencyCircle,
  'radial-spectrum': RadialSpectrum,
  'waveform-tunnel': WaveformTunnel,
  'particle-nebula': ParticleNebula,
  'oscilloscope': Oscilloscope,
  'geometric-mandala': GeometricMandala,
  'audio-landscape': AudioLandscape,
  'circular-waveform': CircularWaveform,
} as const

export const VISUALIZER_NAMES: Record<VisualizerPreset, string> = {
  'frequency-circle': 'Frequency Circle',
  'radial-spectrum': 'Radial Spectrum',
  'waveform-tunnel': 'Waveform Tunnel',
  'particle-nebula': 'Particle Nebula',
  'oscilloscope': 'Oscilloscope',
  'geometric-mandala': 'Geometric Mandala',
  'audio-landscape': 'Audio Landscape',
  'circular-waveform': 'Circular Waveform',
}

export type VisualizerComponent = typeof VISUALIZERS[keyof typeof VISUALIZERS]
