import { FrequencyCircle } from './frequency-circle'
import { PulsingOrb } from './pulsing-orb'
import { RadialSpectrum } from './radial-spectrum'
import { ParticleRing } from './particle-ring'
import { WaveCircle } from './wave-circle'
import { ButterchurnVisualizer } from './butterchurn'

export const VISUALIZERS = {
  'butterchurn': ButterchurnVisualizer,
  'frequency-circle': FrequencyCircle,
  'pulsing-orb': PulsingOrb,
  'radial-spectrum': RadialSpectrum,
  'particle-ring': ParticleRing,
  'wave-circle': WaveCircle,
} as const

export type VisualizerPreset = keyof typeof VISUALIZERS
