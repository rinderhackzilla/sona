import { useEffect, useRef } from 'react'
import butterchurn from 'butterchurn'
import * as presets from 'butterchurn-presets'
import { usePlayerRef, usePlayerIsPlaying } from '@/store/player.store'

// Global audio context singleton
let globalAudioContext: AudioContext | null = null
let globalAnalyser: AnalyserNode | null = null
let globalSource: MediaElementAudioSourceNode | null = null

export function ButterchurnVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visualizerRef = useRef<any>(null)
  
  const audioElement = usePlayerRef()
  const isPlaying = usePlayerIsPlaying()

  // Initialize audio context FIRST
  useEffect(() => {
    if (!audioElement) return

    try {
      // Create audio context
      if (!globalAudioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        globalAudioContext = new AudioContextClass()
        console.log('[Butterchurn] Created AudioContext')
      }

      // Create analyser
      if (!globalAnalyser && globalAudioContext) {
        globalAnalyser = globalAudioContext.createAnalyser()
        globalAnalyser.fftSize = 2048
        globalAnalyser.smoothingTimeConstant = 0.8
        console.log('[Butterchurn] Created AnalyserNode')
      }

      // Connect audio source
      if (!globalSource && globalAudioContext && globalAnalyser) {
        try {
          globalSource = globalAudioContext.createMediaElementSource(audioElement)
          globalSource.connect(globalAnalyser)
          globalAnalyser.connect(globalAudioContext.destination)
          console.log('[Butterchurn] ✅ Audio connected')
        } catch (error: any) {
          if (error.name !== 'InvalidStateError') {
            console.error('[Butterchurn] Error connecting audio:', error)
          }
        }
      }

      // Resume if suspended
      if (globalAudioContext?.state === 'suspended') {
        globalAudioContext.resume()
      }
    } catch (error) {
      console.error('[Butterchurn] Audio setup error:', error)
    }
  }, [audioElement])

  // Create visualizer AFTER audio context
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !globalAudioContext || !globalAnalyser) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width
    canvas.height = height

    try {
      // Create visualizer with audio context
      visualizerRef.current = butterchurn.createVisualizer(globalAudioContext, canvas, {
        width,
        height,
        pixelRatio: window.devicePixelRatio || 1,
        textureRatio: 1,
      })

      // Connect to analyser
      visualizerRef.current.connectAudio(globalAnalyser)

      // Load random preset
      const presetKeys = Object.keys(presets)
      const randomKey = presetKeys[Math.floor(Math.random() * presetKeys.length)]
      const preset = presets[randomKey as keyof typeof presets]
      
      visualizerRef.current.loadPreset(preset, 0)
      console.log('[Butterchurn] ✅ Visualizer created with preset:', randomKey)
    } catch (error) {
      console.error('[Butterchurn] Error creating visualizer:', error)
    }

    return () => {
      if (visualizerRef.current) {
        try {
          visualizerRef.current.destroy()
        } catch (error) {
          console.warn('[Butterchurn] Cleanup warning:', error)
        }
        visualizerRef.current = null
      }
    }
  }, [globalAudioContext, globalAnalyser])

  // Animation loop
  useEffect(() => {
    if (!visualizerRef.current || !isPlaying) return

    let animationId: number

    const render = () => {
      if (visualizerRef.current) {
        try {
          visualizerRef.current.render()
        } catch (error) {
          // Silently ignore render errors
        }
      }
      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isPlaying])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (canvas && visualizerRef.current) {
        const width = canvas.offsetWidth
        const height = canvas.offsetHeight
        canvas.width = width
        canvas.height = height
        try {
          visualizerRef.current.setRendererSize(width, height)
        } catch (error) {
          // Ignore resize errors
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  )
}
