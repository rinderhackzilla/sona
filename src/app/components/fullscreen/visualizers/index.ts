import { AudioLandscape } from './audio-landscape'
import { ButterchurnVisualizer } from './butterchurn'
import { CircularWaveform } from './circular-waveform'
import { FrequencyCircle } from './frequency-circle'
import { GeometricMandala } from './geometric-mandala'
import { Oscilloscope } from './oscilloscope'
import { ParticleNebula } from './particle-nebula'
import { ParticleRing } from './particle-ring'
import { PulsingOrb } from './pulsing-orb'
import { RadialSpectrum } from './radial-spectrum'
import { WaveformTunnel } from './waveform-tunnel'

export const VISUALIZERS = {
  'pulsing-orb': PulsingOrb,
  'particle-ring': ParticleRing,
  'radial-spectrum': RadialSpectrum,
  'frequency-circle': FrequencyCircle,
  'geometric-mandala': GeometricMandala,
  'circular-waveform': CircularWaveform,
  'particle-nebula': ParticleNebula,
  'audio-landscape': AudioLandscape,
  'waveform-tunnel': WaveformTunnel,
  'oscilloscope': Oscilloscope,
  'butterchurn': ButterchurnVisualizer,
} as const

export type VisualizerPreset = keyof typeof VISUALIZERS

export const VISUALIZER_NAMES: Record<VisualizerPreset, string> = {
  'pulsing-orb': 'Pulsing Orb',
  'particle-ring': 'Particle Ring',
  'radial-spectrum': 'Radial Spectrum',
  'frequency-circle': 'Frequency Circle',
  'geometric-mandala': 'Geometric Mandala',
  'circular-waveform': 'Circular Waveform',
  'particle-nebula': 'Particle Nebula',
  'audio-landscape': 'Audio Landscape',
  'waveform-tunnel': 'Waveform Tunnel',
  'oscilloscope': 'Oscilloscope',
  'butterchurn': 'Butterchurn',
}
