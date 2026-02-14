import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying } from '@/store/player.store'
import { getGlobalAnalyser } from './use-audio-context'

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

    // Get the global analyser that's already in the audio chain
    const analyser = getGlobalAnalyser()
    
    if (!analyser) {
      console.warn('[Visualizer] No analyser available yet')
      return
    }

    console.log('[Visualizer] Using analyser from audio chain')

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
        console.log(`[Visualizer] 🎵 REAL DATA - avg: ${avg.toFixed(1)}, max: ${max}`)
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
  }, [isPlaying])

  return {
    frequencyData,
    timeData,
    analyser: getGlobalAnalyser(),
  }
}
