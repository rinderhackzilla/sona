import { FrequencyCircle } from './frequency-circle'
import { PulsingOrb } from './pulsing-orb'
import { RadialSpectrum } from './radial-spectrum'
import { ParticleRing } from './particle-ring'
import { WaveCircle } from './wave-circle'

export const VISUALIZERS = {
  'frequency-circle': FrequencyCircle,
  'pulsing-orb': PulsingOrb,
  'radial-spectrum': RadialSpectrum,
  'particle-ring': ParticleRing,
  'wave-circle': WaveCircle,
} as const

export type VisualizerPreset = keyof typeof VISUALIZERS

export const VISUALIZER_NAMES: Record<VisualizerPreset, string> = {
  'frequency-circle': 'Frequency Circle',
  'pulsing-orb': 'Pulsing Orb',
  'radial-spectrum': 'Radial Spectrum',
  'particle-ring': 'Particle Ring',
  'wave-circle': 'Wave Circle',
}
