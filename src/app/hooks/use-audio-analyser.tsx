import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying } from '@/store/player.store'

let globalAnalyser: AnalyserNode | null = null
let globalAudioContext: AudioContext | null = null
let globalSource: MediaElementAudioSourceNode | null = null

export function useAudioAnalyser() {
  const isPlaying = usePlayerIsPlaying()
  
  const animationFrameRef = useRef<number | null>(null)
  
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128))
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array(128))

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    // Find audio element
    const audioElement = document.querySelector('audio') as HTMLAudioElement
    if (!audioElement) {
      console.warn('[Visualizer] No audio element found')
      return
    }

    // Setup audio context and analyser (singleton)
    if (!globalAudioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        globalAudioContext = new AudioContextClass()
        console.log('[Visualizer] Created AudioContext')
      } catch (error) {
        console.error('[Visualizer] Error creating AudioContext:', error)
        return
      }
    }

    if (!globalAnalyser && globalAudioContext) {
      try {
        globalAnalyser = globalAudioContext.createAnalyser()
        globalAnalyser.fftSize = 256
        globalAnalyser.smoothingTimeConstant = 0.8
        console.log('[Visualizer] Created AnalyserNode')
      } catch (error) {
        console.error('[Visualizer] Error creating AnalyserNode:', error)
        return
      }
    }

    if (!globalSource && globalAudioContext && globalAnalyser) {
      try {
        globalSource = globalAudioContext.createMediaElementSource(audioElement)
        globalSource.connect(globalAnalyser)
        globalAnalyser.connect(globalAudioContext.destination)
        console.log('[Visualizer] Connected audio pipeline')
      } catch (error) {
        // Might already be connected
        console.warn('[Visualizer] Could not connect source (might be already connected):', error)
      }
    }

    // Resume context if suspended
    if (globalAudioContext && globalAudioContext.state === 'suspended') {
      globalAudioContext.resume()
      console.log('[Visualizer] Resumed AudioContext')
    }

    const analyser = globalAnalyser
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const freqDataArray = new Uint8Array(bufferLength)
    const timeDataArray = new Uint8Array(bufferLength)

    let frameCount = 0

    const updateData = () => {
      if (!analyser) return

      analyser.getByteFrequencyData(freqDataArray)
      analyser.getByteTimeDomainData(timeDataArray)

      setFrequencyData(new Uint8Array(freqDataArray))
      setTimeData(new Uint8Array(timeDataArray))

      // Debug every 60 frames
      if (frameCount % 60 === 0) {
        const avg = freqDataArray.reduce((a, b) => a + b, 0) / freqDataArray.length
        if (avg > 0) {
          console.log('[Visualizer] Average frequency:', avg.toFixed(2))
        }
      }
      frameCount++

      animationFrameRef.current = requestAnimationFrame(updateData)
    }

    updateData()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying])

  return {
    frequencyData,
    timeData,
    analyser: globalAnalyser,
  }
}
