export type VisualizerPreset =
  | 'frequency-circle'
  | 'pulsing-orb'
  | 'radial-spectrum'
  | 'particle-ring'
  | 'wave-circle'

export interface VisualizerSettings {
  enabled: boolean
  preset: VisualizerPreset
  showCover: boolean
}
