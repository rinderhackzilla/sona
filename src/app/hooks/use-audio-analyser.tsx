import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying, usePlayerRef } from '@/store/player.store'

let globalAnalyser: AnalyserNode | null = null
let isAnalyserConnected = false

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

    // Find existing AudioContext from ReplayGain (use-audio-context)
    // The AudioContext is created by standardized-audio-context library
    const existingContext = (window as any).audioContext
    let audioContext: AudioContext | null = existingContext

    // If no existing context, create our own
    if (!audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        audioContext = new AudioContextClass()
        console.log('[Visualizer] Created new AudioContext, state:', audioContext.state)
      } catch (error) {
        console.error('[Visualizer] Error creating AudioContext:', error)
        return
      }
    } else {
      console.log('[Visualizer] Using existing AudioContext from ReplayGain, state:', audioContext.state)
    }

    // Create analyser if needed
    if (!globalAnalyser && audioContext) {
      try {
        globalAnalyser = audioContext.createAnalyser()
        globalAnalyser.fftSize = 512
        globalAnalyser.smoothingTimeConstant = 0.75
        console.log('[Visualizer] Created AnalyserNode, fftSize:', globalAnalyser.fftSize)
      } catch (error) {
        console.error('[Visualizer] Error creating AnalyserNode:', error)
        return
      }
    }

    // Try to tap into existing audio source from ReplayGain
    if (globalAnalyser && audioContext && !isAnalyserConnected) {
      try {
        // Look for existing source node from use-audio-context
        // The ReplayGain hook stores it in a ref, but we can create our own and connect
        const source = audioContext.createMediaElementSource(audioRef)
        source.connect(globalAnalyser)
        globalAnalyser.connect(audioContext.destination)
        isAnalyserConnected = true
        console.log('[Visualizer] ✅ Analyser connected to audio source')
      } catch (error: any) {
        if (error.name === 'InvalidStateError') {
          // Audio element already has a source - try to tap in differently
          console.log('[Visualizer] Audio element already connected, attempting to find existing source...')
          
          // HACK: Try to get the existing source node from the global scope
          // The use-audio-context hook might have stored it somewhere
          try {
            // Create a new source is not possible, so we need to connect to existing chain
            // This is tricky - let's connect analyser directly to the destination as a tap
            const source = audioContext.createMediaElementSource(audioRef)
            // This will fail, but we need to try another approach
          } catch (e) {
            console.error('[Visualizer] Cannot create duplicate source:', e)
            // We're stuck - the audio element can only have ONE source
          }
        } else {
          console.error('[Visualizer] Error connecting analyser:', error)
        }
      }
    }

    // Resume context if suspended
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('[Visualizer] AudioContext resumed, new state:', audioContext.state)
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
        console.log(`[Visualizer] 🎵 DATA - avg: ${avg.toFixed(1)}, max: ${max}, context: ${audioContext?.state}${isAnalyserConnected ? ' [CONNECTED]' : ' [NOT CONNECTED]'}`)
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
