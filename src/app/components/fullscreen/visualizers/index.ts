import { AudioLandscape } from './audio-landscape'
import { FrequencyCircle } from './frequency-circle'
import { GeometricMandala } from './geometric-mandala'
import { ParticleNebula } from './particle-nebula'
import { ParticleRing } from './particle-ring'
import { PulsingOrb } from './pulsing-orb'
import { RadialSpectrum } from './radial-spectrum'

export const VISUALIZERS = {
  'pulsing-orb': PulsingOrb,
  'particle-ring': ParticleRing,
  'radial-spectrum': RadialSpectrum,
  'frequency-circle': FrequencyCircle,
  'geometric-mandala': GeometricMandala,
  'particle-nebula': ParticleNebula,
  'audio-landscape': AudioLandscape,
} as const

export type VisualizerPreset = keyof typeof VISUALIZERS

export const VISUALIZER_NAMES: Record<VisualizerPreset, string> = {
  'pulsing-orb': 'Pulsing Orb',
  'particle-ring': 'Particle Ring',
  'radial-spectrum': 'Radial Spectrum',
  'frequency-circle': 'Frequency Circle',
  'geometric-mandala': 'Geometric Mandala',
  'particle-nebula': 'Particle Nebula',
  'audio-landscape': 'Audio Landscape',
}
