import { FrequencyCircle } from './frequency-circle'
import { RadialSpectrum } from './radial-spectrum'
import { WaveformTunnel } from './waveform-tunnel'
import { ParticleNebula } from './particle-nebula'
import { Oscilloscope } from './oscilloscope'
import { GeometricMandala } from './geometric-mandala'
import { AudioLandscape } from './audio-landscape'
import { CircularWaveform } from './circular-waveform'
import { PulsingOrb } from './pulsing-orb'
import { ParticleRing } from './particle-ring'
import { WaveCircle } from './wave-circle'
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
  'pulsing-orb': PulsingOrb,
  'particle-ring': ParticleRing,
  'wave-circle': WaveCircle,
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
  'pulsing-orb': 'Pulsing Orb',
  'particle-ring': 'Particle Ring',
  'wave-circle': 'Wave Circle',
}

export type VisualizerComponent = typeof VISUALIZERS[keyof typeof VISUALIZERS]
