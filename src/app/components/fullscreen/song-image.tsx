import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useVisualizerContext } from '@/app/components/fullscreen/settings'
import { VISUALIZERS } from '@/app/components/fullscreen/visualizers'
import { ImageLoader } from '@/app/components/image-loader'
import { getGlobalAnalyser } from '@/app/hooks/use-audio-context'
import { useRafLoop } from '@/app/hooks/use-raf-loop'
import { useReducedMotion } from '@/app/hooks/use-reduced-motion'
import {
  usePlayerIsPlaying,
  usePlayerStore,
  useSessionModeSettings,
} from '@/store/player.store'
import { useFullscreenState } from '@/store/ui.store'

interface FullscreenSongImageProps {
  isChromeVisible: boolean
}

export function FullscreenSongImage({
  isChromeVisible,
}: FullscreenSongImageProps) {
  const { coverArt, artist, title } = usePlayerStore(({ songlist }) => {
    return songlist.currentSong
  })

  const [showVisualizer, setShowVisualizer] = useState(false)
  const [renderVisualizerLayer, setRenderVisualizerLayer] = useState(false)
  const {
    preset,
    setVisualizerActive,
    renderQuality,
    setRenderQuality,
    autoQualityEnabled,
  } = useVisualizerContext()
  const setFullscreenVisualizerActive = useFullscreenState(
    (state) => state.setVisualizerActive,
  ) as ((active: boolean) => void) | undefined
  const isPlaying = usePlayerIsPlaying()
  const { mode } = useSessionModeSettings()
  const reduceMotion = useReducedMotion()
  const glowRef = useRef<HTMLDivElement | null>(null)
  const smoothedRef = useRef(0.16)
  const peakRef = useRef(0)
  const freqBufferRef = useRef<Uint8Array | null>(null)

  const handleClick = () => {
    setShowVisualizer(!showVisualizer)
  }

  const VisualizerComponent = VISUALIZERS[preset]

  useEffect(() => {
    setVisualizerActive(showVisualizer)
    if (typeof setFullscreenVisualizerActive === 'function') {
      setFullscreenVisualizerActive(showVisualizer)
    }
    return () => {
      setVisualizerActive(false)
      if (typeof setFullscreenVisualizerActive === 'function') {
        setFullscreenVisualizerActive(false)
      }
    }
  }, [setFullscreenVisualizerActive, setVisualizerActive, showVisualizer])

  useEffect(() => {
    if (showVisualizer) {
      setRenderVisualizerLayer(true)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setRenderVisualizerLayer(false)
    }, 320)

    return () => window.clearTimeout(timeoutId)
  }, [showVisualizer])

  useEffect(() => {
    if (!showVisualizer || !autoQualityEnabled) return

    let rafId = 0
    let sampleStartTs = performance.now()
    let sampleFrames = 0
    let lowFpsMs = 0
    let highFpsMs = 0

    const tick = (ts: number) => {
      sampleFrames += 1
      const elapsed = ts - sampleStartTs

      if (elapsed >= 500) {
        const fps = (sampleFrames * 1000) / elapsed

        if (fps < 45) {
          lowFpsMs += elapsed
          highFpsMs = 0
        } else if (fps > 58) {
          highFpsMs += elapsed
          lowFpsMs = 0
        } else {
          lowFpsMs = 0
          highFpsMs = 0
        }

        if (lowFpsMs >= 1500 && renderQuality !== 'lite') {
          setRenderQuality('lite')
          lowFpsMs = 0
          highFpsMs = 0
        }

        if (highFpsMs >= 6000 && renderQuality !== 'high') {
          setRenderQuality('high')
          lowFpsMs = 0
          highFpsMs = 0
        }

        sampleStartTs = ts
        sampleFrames = 0
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [autoQualityEnabled, renderQuality, setRenderQuality, showVisualizer])

  useEffect(() => {
    if (!glowRef.current) return

    if (mode !== 'night' || reduceMotion) {
      glowRef.current.style.setProperty('--cover-glow-pulse', '1')
      smoothedRef.current = 0.16
      peakRef.current = 0
      return
    }
  }, [mode, reduceMotion])

  useRafLoop(
    () => {
      if (!glowRef.current) return
      if (mode !== 'night' || reduceMotion) {
        glowRef.current.style.setProperty('--cover-glow-pulse', '1')
        return
      }

      const analyser = getGlobalAnalyser()
      let smoothed = smoothedRef.current
      let peak = peakRef.current
      let freqBuffer = freqBufferRef.current

      if (!isPlaying || !analyser) {
        peak *= 0.84
        smoothed += (0.14 - smoothed) * 0.14
      } else {
        if (!freqBuffer || freqBuffer.length !== analyser.frequencyBinCount) {
          freqBuffer = new Uint8Array(analyser.frequencyBinCount)
          freqBufferRef.current = freqBuffer
        }
        analyser.getByteFrequencyData(freqBuffer)
        let bassSum = 0
        const bassBands = Math.min(10, freqBuffer.length)
        for (let i = 0; i < bassBands; i++) bassSum += freqBuffer[i]
        const bass = bassBands > 0 ? bassSum / bassBands / 255 : 0

        peak = Math.max(bass, peak * 0.88)
        const rhythmic = bass * 0.62 + peak * 0.38
        smoothed += (rhythmic - smoothed) * 0.24
      }

      smoothedRef.current = smoothed
      peakRef.current = peak
      const pulse = Math.min(2.8, Math.max(0.72, 0.72 + smoothed * 2.25))
      glowRef.current.style.setProperty('--cover-glow-pulse', pulse.toFixed(3))
    },
    mode === 'night' && !reduceMotion && showVisualizer,
    [isPlaying, mode, reduceMotion, showVisualizer],
  )

  return (
    // Height-driven square: height is constrained by the available row height,
    // width follows via aspect-square. Never overflows its container.
    <div
      className={clsx(
        'relative h-full aspect-square flex-shrink-0 min-h-0 flex items-center justify-center transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        showVisualizer
          ? 'max-h-[520px] 2xl:max-h-[640px]'
          : isChromeVisible
            ? 'max-h-[520px] 2xl:max-h-[640px]'
            : 'max-h-[595px] 2xl:max-h-[720px]',
      )}
    >
      {mode === 'night' && (
        <div
          ref={glowRef}
          className="fullscreen-cover-glow pointer-events-none absolute -inset-3 z-0 rounded-[16px] 2xl:rounded-[18px]"
        />
      )}
      <div
        className={clsx(
          'relative z-10 w-full h-full rounded-xl overflow-hidden cursor-pointer fullscreen-cover-frame',
          'bg-primary/10',
        )}
        onClick={handleClick}
      >
        <div
          className={clsx(
            'absolute inset-0 transition-opacity duration-300',
            showVisualizer ? 'opacity-0' : 'opacity-100',
          )}
        >
          <ImageLoader id={coverArt} type="song" size={800}>
            {(src, isLoading) => (
              <img
                src={src}
                alt={`${artist} - ${title}`}
                className={clsx(
                  'absolute inset-0 w-full h-full object-cover shadow-custom-5 transition-opacity duration-300 opacity-0',
                  !isLoading && 'opacity-100',
                )}
              />
            )}
          </ImageLoader>
        </div>

        {renderVisualizerLayer && (
          <div
            className={clsx(
              'absolute inset-0 transition-opacity duration-300',
              showVisualizer ? 'opacity-100' : 'opacity-0',
            )}
          >
            <VisualizerComponent />
          </div>
        )}
      </div>
    </div>
  )
}
