import type { IAudioContext, IMediaElementAudioSourceNode } from 'standardized-audio-context'

type IAudioSource = IMediaElementAudioSourceNode<IAudioContext>

let globalAnalyser: AnalyserNode | null = null
let globalAudioContext: IAudioContext | null = null
const globalMediaSourceNodes = new WeakMap<HTMLAudioElement, IAudioSource>()

export function getGlobalAudioContext() {
  return globalAudioContext
}

export function setGlobalAudioContext(context: IAudioContext) {
  globalAudioContext = context
}

export function getGlobalAnalyserNode() {
  return globalAnalyser
}

export function setGlobalAnalyserNode(analyser: AnalyserNode | null) {
  globalAnalyser = analyser
}

export function getGlobalMediaSourceNode(audio: HTMLAudioElement) {
  return globalMediaSourceNodes.get(audio)
}

export function setGlobalMediaSourceNode(audio: HTMLAudioElement, node: IAudioSource) {
  globalMediaSourceNodes.set(audio, node)
}
