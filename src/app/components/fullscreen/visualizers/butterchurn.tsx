import { useEffect, useRef } from 'react'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'
import { usePlayerRef, usePlayerIsPlaying } from '@/store/player.store'

export function ButterchurnVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visualizerRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  
  const audioElement = usePlayerRef()
  const isPlaying = usePlayerIsPlaying()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !audioElement) return

    // Get canvas size
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width
    canvas.height = height

    try {
      // Create visualizer
      visualizerRef.current = butterchurn.createVisualizer(audioContextRef.current, canvas, {
        width,
        height,
        pixelRatio: window.devicePixelRatio || 1,
        textureRatio: 1,
      })

      // Load a preset
      const presets = butterchurnPresets.getPresets()
      const presetKeys = Object.keys(presets)
      
      // Select a cool preset (you can randomize or let user choose)
      const selectedPreset = presets[presetKeys[Math.floor(Math.random() * presetKeys.length)]]
      visualizerRef.current.loadPreset(selectedPreset, 0)

      console.log('[Butterchurn] Visualizer created with preset')
    } catch (error) {
      console.error('[Butterchurn] Error creating visualizer:', error)
    }

    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.destroy()
        visualizerRef.current = null
      }
    }
  }, [audioElement])

  // Setup audio context and connect
  useEffect(() => {
    if (!audioElement || !isPlaying) return

    try {
      // Create audio context
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContextClass()
        console.log('[Butterchurn] Created AudioContext')
      }

      // Create analyser
      if (!analyserRef.current && audioContextRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 2048
        console.log('[Butterchurn] Created AnalyserNode')
      }

      // Connect audio source
      if (!sourceRef.current && audioContextRef.current && analyserRef.current) {
        try {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement)
          sourceRef.current.connect(analyserRef.current)
          analyserRef.current.connect(audioContextRef.current.destination)
          console.log('[Butterchurn] ✅ Audio connected')
        } catch (error: any) {
          if (error.name === 'InvalidStateError') {
            console.log('[Butterchurn] Audio already connected')
          } else {
            console.error('[Butterchurn] Error connecting audio:', error)
          }
        }
      }

      // Resume if suspended
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
    } catch (error) {
      console.error('[Butterchurn] Setup error:', error)
    }
  }, [audioElement, isPlaying])

  // Animation loop
  useEffect(() => {
    if (!visualizerRef.current || !isPlaying) return

    let animationId: number

    const render = () => {
      if (visualizerRef.current) {
        visualizerRef.current.render()
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
        visualizerRef.current.setRendererSize(width, height)
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
