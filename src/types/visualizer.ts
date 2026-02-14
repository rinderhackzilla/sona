export type VisualizerPreset =
  | 'frequency-circle'
  | 'radial-spectrum'
  | 'waveform-tunnel'
  | 'bass-reactor'
  | 'frequency-spiral'

export interface VisualizerSettings {
  enabled: boolean
  preset: VisualizerPreset
  showCover: boolean
}
