export type VisualizerPreset =
  | 'frequency-circle'
  | 'waveform-tunnel'
  | 'oscilloscope'
  | 'geometric-mandala'
  | 'audio-landscape'
  | 'circular-waveform'

export interface VisualizerSettings {
  enabled: boolean
  preset: VisualizerPreset
  showCover: boolean
}
