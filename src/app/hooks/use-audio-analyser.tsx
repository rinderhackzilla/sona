import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying, usePlayerRef } from '@/store/player.store'

interface AudioAnalyserData {
  frequencyData: Uint8Array
  timeData: Uint8Array
  analyser: AnalyserNode | null
}

export function useAudioAnalyser() {
  const audioRef = usePlayerRef()
  const isPlaying = usePlayerIsPlaying()
  
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0))
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array(0))

  useEffect(() => {
    if (!audioRef || !isPlaying) {
      // Stop animation loop when not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    // Setup audio context and analyser
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContextClass()
    }

    if (!analyserRef.current && audioContextRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.8
    }

    if (!sourceRef.current && audioContextRef.current && analyserRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef)
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
      } catch (error) {
        // Source might already be connected, ignore error
        console.warn('Audio source already connected:', error)
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
  }, [audioRef, isPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    frequencyData,
    timeData,
    analyser: analyserRef.current,
  }
}
