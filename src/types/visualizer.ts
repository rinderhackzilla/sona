export type VisualizerPreset =
  | 'frequency-circle'
  | 'radial-spectrum'
  | 'waveform-tunnel'

export interface VisualizerSettings {
  enabled: boolean
  preset: VisualizerPreset
  showCover: boolean
}
