import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying } from '@/store/player.store'

interface AudioAnalyserData {
  frequencyData: Uint8Array
  timeData: Uint8Array
  analyser: AnalyserNode | null
}

export function useAudioAnalyser() {
  const isPlaying = usePlayerIsPlaying()
  
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128))
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array(128))

  useEffect(() => {
    if (!isPlaying) {
      // Stop animation loop when not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    // Try to get existing audio element
    const audioElement = document.querySelector('audio')
    if (!audioElement) {
      console.warn('No audio element found')
      return
    }

    // Setup audio context and analyser
    if (!analyserRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContextClass()
        
        analyserRef.current = audioContext.createAnalyser()
        analyserRef.current.fftSize = 256 // Smaller for better performance
        analyserRef.current.smoothingTimeConstant = 0.85
        
        const source = audioContext.createMediaElementSource(audioElement)
        source.connect(analyserRef.current)
        analyserRef.current.connect(audioContext.destination)
      } catch (error) {
        console.error('Error setting up audio analyser:', error)
        return
      }
    }

    // Animation loop to update frequency and time data
    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const freqDataArray = new Uint8Array(bufferLength)
    const timeDataArray = new Uint8Array(bufferLength)

    const updateData = () => {
      if (!analyser) return

      analyser.getByteFrequencyData(freqDataArray)
      analyser.getByteTimeDomainData(timeDataArray)

      setFrequencyData(new Uint8Array(freqDataArray))
      setTimeData(new Uint8Array(timeDataArray))

      animationFrameRef.current = requestAnimationFrame(updateData)
    }

    updateData()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    frequencyData,
    timeData,
    analyser: analyserRef.current,
  }
}
