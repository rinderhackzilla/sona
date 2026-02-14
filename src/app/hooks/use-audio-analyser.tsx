import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying, usePlayerProgress } from '@/store/player.store'

// Simulate audio frequencies based on playback
function generateSimulatedFrequencies(progress: number, bufferSize: number): Uint8Array {
  const data = new Uint8Array(bufferSize)
  const time = Date.now() / 1000
  
  for (let i = 0; i < bufferSize; i++) {
    // Create wave patterns that look like real audio
    const frequency = i / bufferSize
    const wave1 = Math.sin(time * 2 + i * 0.1) * 50
    const wave2 = Math.sin(time * 3 + i * 0.05) * 30
    const wave3 = Math.sin(time * 5 + frequency * Math.PI * 2) * 40
    
    // Bass frequencies (lower indices) should be stronger
    const bassBoost = frequency < 0.2 ? 1.5 : 1.0
    
    // Add some randomness
    const noise = (Math.random() - 0.5) * 20
    
    const value = (wave1 + wave2 + wave3 + noise) * bassBoost + 80
    data[i] = Math.max(0, Math.min(255, value))
  }
  
  return data
}

export function useAudioAnalyser() {
  const isPlaying = usePlayerIsPlaying()
  const progress = usePlayerProgress()
  
  const animationFrameRef = useRef<number | null>(null)
  
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128))
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array(128))

  useEffect(() => {
    if (!isPlaying) {
      // Reset to flat when not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setFrequencyData(new Uint8Array(128))
      setTimeData(new Uint8Array(128))
      return
    }

    console.log('[Visualizer] Using simulated audio data (CORS workaround)')

    const bufferLength = 128
    let lastLogTime = Date.now()

    const updateData = () => {
      // Generate simulated frequency data
      const freqDataArray = generateSimulatedFrequencies(progress, bufferLength)
      const timeDataArray = new Uint8Array(bufferLength)
      
      // Generate time domain data (waveform)
      for (let i = 0; i < bufferLength; i++) {
        const t = i / bufferLength
        timeDataArray[i] = 128 + Math.sin(Date.now() / 100 + t * Math.PI * 2) * 50
      }

      setFrequencyData(freqDataArray)
      setTimeData(timeDataArray)

      // Debug every 3 seconds
      const now = Date.now()
      if (now - lastLogTime > 3000) {
        const avg = freqDataArray.reduce((a, b) => a + b, 0) / freqDataArray.length
        const max = Math.max(...Array.from(freqDataArray))
        console.log(`[Visualizer] 🎵 Simulated - avg: ${avg.toFixed(1)}, max: ${max}`)
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
  }, [isPlaying, progress])

  return {
    frequencyData,
    timeData,
    analyser: null,
  }
}
