import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying } from '@/store/player.store'
import { getGlobalAnalyser } from './use-audio-context'

export function useAudioAnalyser() {
  const isPlaying = usePlayerIsPlaying()

  const animationFrameRef = useRef<number | null>(null)

  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    new Uint8Array(128),
  )
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array(128))

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const analyser = getGlobalAnalyser()
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

  return {
    frequencyData,
    timeData,
    analyser: getGlobalAnalyser(),
  }
}
