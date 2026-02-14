export type VisualizerPreset =
  | 'frequency-circle'
  | 'radial-spectrum'
  | 'waveform-tunnel'
  | 'particle-nebula'
  | 'oscilloscope'
  | 'geometric-mandala'
  | 'audio-landscape'
  | 'circular-waveform'

export interface VisualizerSettings {
  enabled: boolean
  preset: VisualizerPreset
  showCover: boolean
}
