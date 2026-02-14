import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { cn } from '@/lib/utils'

interface EqualizerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FREQUENCY_BANDS = [
  { freq: '32 Hz', hz: 32 },
  { freq: '64 Hz', hz: 64 },
  { freq: '125 Hz', hz: 125 },
  { freq: '250 Hz', hz: 250 },
  { freq: '500 Hz', hz: 500 },
  { freq: '1 kHz', hz: 1000 },
  { freq: '2 kHz', hz: 2000 },
  { freq: '4 kHz', hz: 4000 },
]

const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0],
  rock: [5, 4, -2, -3, -1, 2, 4, 5],
  pop: [-1, -1, 0, 2, 4, 4, 2, 0],
  jazz: [4, 3, 1, 2, -1, -1, 0, 2],
  classical: [5, 4, 3, 2, -1, -2, 3, 4],
  electronic: [5, 4, 1, 0, -2, 2, 4, 5],
  acoustic: [5, 4, 3, 1, 2, 2, 3, 3],
  bass_boost: [7, 6, 4, 2, 0, 0, 0, 0],
  treble_boost: [0, 0, 0, 0, 2, 4, 6, 7],
  vocal: [0, -2, -3, -1, 3, 4, 3, 1],
}

// Global audio context shared across entire app
let globalAudioContext: AudioContext | null = null
let globalFilters: BiquadFilterNode[] = []
let globalSource: MediaElementAudioSourceNode | null = null
let isAudioInitialized = false

export function EqualizerModal({ open, onOpenChange }: EqualizerModalProps) {
  const { t } = useTranslation()
  const [gains, setGains] = useState<number[]>(EQ_PRESETS.flat)
  const [selectedPreset, setSelectedPreset] = useState<string>('flat')
  const [isEnabled, setIsEnabled] = useState(false)
  const [initStatus, setInitStatus] = useState<string>('Not initialized')
  const initAttempted = useRef(false)

  // Initialize Web Audio API
  const initializeAudio = useCallback(() => {
    if (isAudioInitialized) {
      setInitStatus('Already initialized')
      return true
    }

    if (initAttempted.current) {
      setInitStatus('Init already attempted')
      return false
    }

    initAttempted.current = true
    setInitStatus('Initializing...')

    try {
      // Find all audio elements
      const audioElements = document.querySelectorAll('audio')
      console.log('Found audio elements:', audioElements.length)
      
      let audioElement: HTMLAudioElement | null = null
      
      // Try to find the active audio element
      for (const el of Array.from(audioElements)) {
        console.log('Audio element:', el.getAttribute('data-testid'), el.src)
        if (el.src && !el.paused) {
          audioElement = el as HTMLAudioElement
          break
        }
      }
      
      // Fallback to first audio element with src
      if (!audioElement) {
        for (const el of Array.from(audioElements)) {
          if (el.src) {
            audioElement = el as HTMLAudioElement
            break
          }
        }
      }

      if (!audioElement) {
        setInitStatus('No audio element found')
        initAttempted.current = false
        return false
      }

      console.log('Using audio element:', audioElement)

      // Check if already connected
      if ((audioElement as any).__eqConnected) {
        setInitStatus('Already connected to this element')
        return false
      }

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!globalAudioContext) {
        globalAudioContext = new AudioContext()
        console.log('Created AudioContext:', globalAudioContext.state)
      }

      // Resume context if suspended
      if (globalAudioContext.state === 'suspended') {
        globalAudioContext.resume()
      }

      // Create source - this can only be done once per element
      try {
        globalSource = globalAudioContext.createMediaElementSource(audioElement)
        ;(audioElement as any).__eqConnected = true
        console.log('Created MediaElementSource')
      } catch (error: any) {
        if (error.name === 'InvalidStateError') {
          setInitStatus('Element already connected elsewhere')
          initAttempted.current = false
          return false
        }
        throw error
      }

      // Create filters for each band
      const filters = FREQUENCY_BANDS.map((band, index) => {
        const filter = globalAudioContext!.createBiquadFilter()
        
        if (index === 0) {
          filter.type = 'lowshelf'
        } else if (index === FREQUENCY_BANDS.length - 1) {
          filter.type = 'highshelf'
        } else {
          filter.type = 'peaking'
        }
        
        filter.frequency.value = band.hz
        filter.Q.value = 1.0
        filter.gain.value = 0
        
        console.log(`Created filter ${index}: ${band.freq}, type: ${filter.type}`)
        return filter
      })

      globalFilters = filters

      // Connect audio graph: source -> filters -> destination
      let prevNode: AudioNode = globalSource
      filters.forEach((filter, index) => {
        prevNode.connect(filter)
        prevNode = filter
        console.log(`Connected filter ${index}`)
      })
      prevNode.connect(globalAudioContext.destination)
      console.log('Connected to destination')

      isAudioInitialized = true
      setInitStatus('✓ Initialized successfully')
      console.log('Web Audio API initialized successfully')
      return true

    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error)
      setInitStatus(`Error: ${(error as Error).message}`)
      initAttempted.current = false
      return false
    }
  }, [])

  // Try to initialize when modal opens
  useEffect(() => {
    if (open && !isAudioInitialized) {
      // Wait a bit for audio element to be ready
      const timer = setTimeout(() => {
        initializeAudio()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [open, initializeAudio])

  // Apply gain changes to filters
  const applyGains = useCallback((newGains: number[]) => {
    if (!isEnabled || !globalFilters.length) {
      console.log('Not applying gains - enabled:', isEnabled, 'filters:', globalFilters.length)
      return
    }

    console.log('Applying gains:', newGains)
    globalFilters.forEach((filter, index) => {
      if (filter) {
        filter.gain.value = newGains[index]
        console.log(`Filter ${index} gain set to ${newGains[index]} dB`)
      }
    })
  }, [isEnabled])

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains]
    newGains[index] = value
    setGains(newGains)
    setSelectedPreset('custom')
    applyGains(newGains)
  }

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    if (preset !== 'custom') {
      const presetGains = EQ_PRESETS[preset as keyof typeof EQ_PRESETS]
      setGains(presetGains)
      applyGains(presetGains)
    }
  }

  const handleReset = () => {
    setGains(EQ_PRESETS.flat)
    setSelectedPreset('flat')
    applyGains(EQ_PRESETS.flat)
  }

  const handleToggle = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    console.log('EQ enabled:', newState)
    
    if (newState) {
      applyGains(gains)
    } else {
      // Reset all filters to 0
      console.log('Disabling EQ - resetting gains to 0')
      globalFilters.forEach((filter, index) => {
        if (filter) {
          filter.gain.value = 0
          console.log(`Filter ${index} reset to 0 dB`)
        }
      })
    }
  }

  // Calculate curve points for visualization
  const getCurvePoints = () => {
    const points: string[] = []
    const width = 100
    const height = 60
    const step = width / (gains.length - 1)
    const centerY = height / 2

    gains.forEach((gain, index) => {
      const x = index * step
      const y = centerY - (gain / 12) * (height / 2)
      points.push(`${x},${y}`)
    })

    return points.join(' ')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span>{t('player.equalizer.title', 'Equalizer')}</span>
              <span className="text-xs font-normal text-muted-foreground">{initStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isAudioInitialized && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initializeAudio}
                >
                  Initialize Audio
                </Button>
              )}
              <Button
                variant={isEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggle}
                disabled={!isAudioInitialized}
              >
                {isEnabled
                  ? t('player.equalizer.enabled', 'Enabled')
                  : t('player.equalizer.disabled', 'Disabled')}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preset Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium min-w-[80px]">
              {t('player.equalizer.preset', 'Preset')}:
            </label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">
                  {t('player.equalizer.presets.flat', 'Flat')}
                </SelectItem>
                <SelectItem value="rock">
                  {t('player.equalizer.presets.rock', 'Rock')}
                </SelectItem>
                <SelectItem value="pop">
                  {t('player.equalizer.presets.pop', 'Pop')}
                </SelectItem>
                <SelectItem value="jazz">
                  {t('player.equalizer.presets.jazz', 'Jazz')}
                </SelectItem>
                <SelectItem value="classical">
                  {t('player.equalizer.presets.classical', 'Classical')}
                </SelectItem>
                <SelectItem value="electronic">
                  {t('player.equalizer.presets.electronic', 'Electronic')}
                </SelectItem>
                <SelectItem value="acoustic">
                  {t('player.equalizer.presets.acoustic', 'Acoustic')}
                </SelectItem>
                <SelectItem value="bass_boost">
                  {t('player.equalizer.presets.bass_boost', 'Bass Boost')}
                </SelectItem>
                <SelectItem value="treble_boost">
                  {t('player.equalizer.presets.treble_boost', 'Treble Boost')}
                </SelectItem>
                <SelectItem value="vocal">
                  {t('player.equalizer.presets.vocal', 'Vocal')}
                </SelectItem>
                {selectedPreset === 'custom' && (
                  <SelectItem value="custom">
                    {t('player.equalizer.presets.custom', 'Custom')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleReset}>
              {t('player.equalizer.reset', 'Reset')}
            </Button>
          </div>

          {/* EQ Curve Visualization */}
          <div className="bg-muted/30 rounded-lg p-6 border">
            <svg
              width="100%"
              height="140"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              className="w-full"
            >
              {/* Grid lines */}
              <line x1="0" y1="15" x2="100" y2="15" stroke="currentColor" strokeWidth="0.1" opacity="0.2" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
              <line x1="0" y1="45" x2="100" y2="45" stroke="currentColor" strokeWidth="0.1" opacity="0.2" />
              
              {/* EQ Curve */}
              <polyline
                points={getCurvePoints()}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              
              {/* Points */}
              {gains.map((gain, index) => {
                const x = (index * 100) / (gains.length - 1)
                const y = 30 - (gain / 12) * 30
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1.2"
                    fill="hsl(var(--primary))"
                  />
                )
              })}
            </svg>
          </div>

          {/* EQ Sliders */}
          <div className="grid grid-cols-8 gap-6 px-2">
            {FREQUENCY_BANDS.map((band, index) => (
              <div key={band.hz} className="flex flex-col items-center gap-3">
                <div className="text-xs font-medium text-muted-foreground text-center whitespace-nowrap">
                  {band.freq}
                </div>
                
                <div className="relative h-48 w-12 flex items-center justify-center">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gains[index]}
                    onChange={(e) => handleGainChange(index, Number(e.target.value))}
                    disabled={!isEnabled}
                    className={cn(
                      'eq-slider',
                      !isEnabled && 'opacity-30 cursor-not-allowed',
                    )}
                    style={{
                      writingMode: 'bt-lr',
                      WebkitAppearance: 'slider-vertical',
                      width: '48px',
                      height: '192px',
                    }}
                  />
                </div>
                
                <div
                  className={cn(
                    'text-xs font-mono text-center min-w-[50px] font-semibold',
                    gains[index] > 0 && 'text-green-500',
                    gains[index] < 0 && 'text-red-500',
                    gains[index] === 0 && 'text-muted-foreground',
                  )}
                >
                  {gains[index] > 0 ? '+' : ''}
                  {gains[index]} dB
                </div>
              </div>
            ))}
          </div>

          {/* Info Text */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            {t(
              'player.equalizer.info',
              'Adjust frequency bands to customize your sound. Changes are applied in real-time.',
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
