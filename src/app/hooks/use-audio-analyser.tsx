import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying, usePlayerRef } from '@/store/player.store'

let globalAnalyser: AnalyserNode | null = null
let globalAudioContext: AudioContext | null = null
let globalSource: MediaElementAudioSourceNode | null = null
let isConnected = false

export function useAudioAnalyser() {
  const audioRef = usePlayerRef()
  const isPlaying = usePlayerIsPlaying()
  
  const animationFrameRef = useRef<number | null>(null)
  
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128))
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array(128))

  useEffect(() => {
    if (!audioRef || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    console.log('[Visualizer] Audio element found')

    // Setup audio context (singleton)
    if (!globalAudioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        globalAudioContext = new AudioContextClass()
        console.log('[Visualizer] Created AudioContext, state:', globalAudioContext.state)
      } catch (error) {
        console.error('[Visualizer] Error creating AudioContext:', error)
        return
      }
    }

    // Setup analyser (singleton)
    if (!globalAnalyser && globalAudioContext) {
      try {
        globalAnalyser = globalAudioContext.createAnalyser()
        globalAnalyser.fftSize = 512
        globalAnalyser.smoothingTimeConstant = 0.75
        console.log('[Visualizer] Created AnalyserNode, fftSize:', globalAnalyser.fftSize)
      } catch (error) {
        console.error('[Visualizer] Error creating AnalyserNode:', error)
        return
      }
    }

    // Connect audio pipeline (only once)
    if (!isConnected && globalAudioContext && globalAnalyser && audioRef) {
      try {
        globalSource = globalAudioContext.createMediaElementSource(audioRef)
        globalSource.connect(globalAnalyser)
        globalAnalyser.connect(globalAudioContext.destination)
        isConnected = true
        console.log('[Visualizer] ✅ Audio pipeline connected successfully')
      } catch (error: any) {
        if (error.name === 'InvalidStateError') {
          console.log('[Visualizer] Audio source already connected (OK)')
          isConnected = true
        } else {
          console.error('[Visualizer] Error connecting audio:', error)
        }
      }
    }

    // Resume context if suspended
    if (globalAudioContext && globalAudioContext.state === 'suspended') {
      globalAudioContext.resume().then(() => {
        console.log('[Visualizer] AudioContext resumed, new state:', globalAudioContext.state)
      })
    }

    const analyser = globalAnalyser
    if (!analyser) {
      console.warn('[Visualizer] No analyser available')
      return
    }

    const bufferLength = analyser.frequencyBinCount
    const freqDataArray = new Uint8Array(bufferLength)
    const timeDataArray = new Uint8Array(bufferLength)

    let lastLogTime = Date.now()

    const updateData = () => {
      if (!analyser) return

      analyser.getByteFrequencyData(freqDataArray)
      analyser.getByteTimeDomainData(timeDataArray)

      setFrequencyData(new Uint8Array(freqDataArray))
      setTimeData(new Uint8Array(timeDataArray))

      // Debug every 2 seconds
      const now = Date.now()
      if (now - lastLogTime > 2000) {
        const avg = freqDataArray.reduce((a, b) => a + b, 0) / freqDataArray.length
        const max = Math.max(...Array.from(freqDataArray))
        console.log(`[Visualizer] 🎵 REAL DATA - avg: ${avg.toFixed(1)}, max: ${max}, context: ${globalAudioContext?.state}`)
        lastLogTime = now
      }

      animationFrameRef.current = requestAnimationFrame(updateData)
    }

    updateData()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioRef, isPlaying])

  return {
    frequencyData,
    timeData,
    analyser: globalAnalyser,
  }
}
