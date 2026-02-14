import { FrequencyCircle } from './frequency-circle'
import { PulsingOrb } from './pulsing-orb'
import { RadialSpectrum } from './radial-spectrum'
import { ParticleRing } from './particle-ring'
import { WaveCircle } from './wave-circle'
import type { VisualizerPreset } from '@/types/visualizer'

export const VISUALIZERS = {
  'frequency-circle': FrequencyCircle,
  'pulsing-orb': PulsingOrb,
  'radial-spectrum': RadialSpectrum,
  'particle-ring': ParticleRing,
  'wave-circle': WaveCircle,
} as const

export const VISUALIZER_NAMES: Record<VisualizerPreset, string> = {
  'frequency-circle': 'Frequency Circle',
  'pulsing-orb': 'Pulsing Orb',
  'radial-spectrum': 'Radial Spectrum',
  'particle-ring': 'Particle Ring',
  'wave-circle': 'Wave Circle',
}

export type VisualizerComponent = typeof VISUALIZERS[keyof typeof VISUALIZERS]
