import { useEffect, useRef, useState } from 'react'
import { usePlayerIsPlaying } from '@/store/player.store'
import { getGlobalAnalyser } from './use-audio-context'

export function useAudioAnalyser() {
  const isPlaying = usePlayerIsPlaying()

  const animationFrameRef = useRef<number | null>(null)
  const frequencyDataRef = useRef<Uint8Array>(new Uint8Array(128))
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(128))
  const [, setTick] = useState(0)

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
    if (frequencyDataRef.current.length !== bufferLength) {
      frequencyDataRef.current = new Uint8Array(bufferLength)
      timeDataRef.current = new Uint8Array(bufferLength)
    }

    const updateData = () => {
      if (!analyser) return

      analyser.getByteFrequencyData(frequencyDataRef.current)
      analyser.getByteTimeDomainData(timeDataRef.current)

      setTick((tick) => tick + 1)

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
    frequencyData: frequencyDataRef.current,
    timeData: timeDataRef.current,
    analyser: getGlobalAnalyser(),
  }
}
