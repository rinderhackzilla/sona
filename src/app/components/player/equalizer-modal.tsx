import { useEffect, useState } from 'react'
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
import { setEqEnabled, setEqGains, getEqState } from '@/app/hooks/use-audio-context'

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

export function EqualizerModal({ open, onOpenChange }: EqualizerModalProps) {
  const { t } = useTranslation()
  const [gains, setGains] = useState<number[]>(EQ_PRESETS.flat)
  const [selectedPreset, setSelectedPreset] = useState<string>('flat')
  const [isEnabled, setIsEnabled] = useState(false)

  // Load saved state on mount
  useEffect(() => {
    const state = getEqState()
    setIsEnabled(state.enabled)
    setGains(state.gains)
  }, [open])

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains]
    newGains[index] = value
    setGains(newGains)
    setSelectedPreset('custom')
    setEqGains(newGains)
  }

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    if (preset !== 'custom') {
      const presetGains = EQ_PRESETS[preset as keyof typeof EQ_PRESETS]
      setGains(presetGains)
      setEqGains(presetGains)
    }
  }

  const handleReset = () => {
    setGains(EQ_PRESETS.flat)
    setSelectedPreset('flat')
    setEqGains(EQ_PRESETS.flat)
  }

  const handleToggle = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    setEqEnabled(newState)
  }

  // Calculate curve points for visualization
  const getCurvePoints = () => {
    const points: { x: number; y: number }[] = []
    const width = 700 // Fixed width in pixels
    const height = 140 // Fixed height in pixels
    const step = width / (gains.length - 1)
    const centerY = height / 2

    gains.forEach((gain, index) => {
      const x = index * step
      const y = centerY - (gain / 12) * (height / 2.5) // Scale factor to keep curve visible
      points.push({ x, y })
    })

    return points
  }

  const curvePoints = getCurvePoints()
  const pathData = curvePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('player.equalizer.title', 'Equalizer')}</span>
            <Button
              variant={isEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggle}
              className="-mr-5"
            >
              {isEnabled
                ? t('player.equalizer.enabled', 'Enabled')
                : t('player.equalizer.disabled', 'Disabled')}
            </Button>
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
              width="700"
              height="140"
              viewBox="0 0 700 140"
              className="w-full"
              style={{ height: 'auto' }}
            >
              {/* Grid lines */}
              <line x1="0" y1="35" x2="700" y2="35" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
              <line x1="0" y1="70" x2="700" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="0" y1="105" x2="700" y2="105" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
              
              {/* EQ Curve */}
              <path
                d={pathData}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              
              {/* Points - perfectly round */}
              {curvePoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="hsl(var(--primary))"
                />
              ))}
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
