import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import {
  getEqState,
  setEqEnabled,
  setEqGains,
} from '@/app/hooks/use-audio-context'
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
  rock: [4, 3, 2, 0, -1, 1, 3, 4],
  pop: [2, 1, 0, -1, -1, 1, 2, 3],
  jazz: [3, 2, 1, 1, 0, 1, 2, 3],
  classical: [2, 1, 0, 0, 1, 2, 3, 4],
  electronic: [4, 3, 1, 0, -2, 1, 3, 4],
  acoustic: [2, 1, 0, 1, 2, 1, 0, 1],
  bass_boost: [8, 6, 4, 2, 0, -1, -2, -2],
  treble_boost: [-2, -2, -1, 0, 2, 4, 6, 8],
  vocal: [-2, -1, 0, 2, 4, 5, 3, 1],
}

export function EqualizerModal({ open, onOpenChange }: EqualizerModalProps) {
  const { t } = useTranslation()
  const [gains, setGains] = useState<number[]>(EQ_PRESETS.flat)
  const [selectedPreset, setSelectedPreset] = useState<string>('flat')
  const [isEnabled, setIsEnabled] = useState(false)
  const SVG_WIDTH = 700
  const SVG_HEIGHT = 140
  const EQ_RANGE = 12

  const clampGain = useCallback(
    (value: number) =>
      Math.max(-EQ_RANGE, Math.min(EQ_RANGE, Math.round(value))),
    [],
  )

  const normalizeGains = useCallback(
    (values: number[]) => values.map((value) => clampGain(value)),
    [clampGain],
  )

  const buildSmoothPath = useCallback((points: { x: number; y: number }[]) => {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`

    let path = `M ${points[0].x},${points[0].y}`

    for (let i = 1; i < points.length; i++) {
      const previous = points[i - 1]
      const current = points[i]
      const midX = (previous.x + current.x) / 2
      const midY = (previous.y + current.y) / 2
      path += ` Q ${previous.x},${previous.y} ${midX},${midY}`
    }

    const penultimate = points[points.length - 2]
    const last = points[points.length - 1]
    path += ` Q ${penultimate.x},${penultimate.y} ${last.x},${last.y}`

    return path
  }, [])

  // Load saved state on mount
  useEffect(() => {
    const state = getEqState()
    setIsEnabled(state.enabled)
    setGains(normalizeGains(state.gains))
  }, [normalizeGains])

  const handleGainChange = (index: number, value: number) => {
    const safeValue = clampGain(value)
    const newGains = [...gains]
    newGains[index] = safeValue
    setGains(newGains)
    setSelectedPreset('custom')
    setEqGains(newGains)
  }

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    if (preset !== 'custom') {
      const presetGains = normalizeGains(
        EQ_PRESETS[preset as keyof typeof EQ_PRESETS],
      )
      setGains(presetGains)
      setEqGains(presetGains)
    }
  }

  const handleReset = () => {
    setGains(EQ_PRESETS.flat)
    setSelectedPreset('flat')
    setEqGains(EQ_PRESETS.flat)
  }

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled)
    setEqEnabled(enabled)
  }

  const bandStep = SVG_WIDTH / (gains.length - 1)
  const centerY = SVG_HEIGHT / 2

  const gainToY = useCallback(
    (gain: number) => centerY - (gain / EQ_RANGE) * (SVG_HEIGHT / 2.5),
    [centerY],
  )

  const curvePoints = useMemo(
    () =>
      gains.map((gain, index) => ({
        x: index * bandStep,
        y: gainToY(gain),
      })),
    [gains, bandStep, gainToY],
  )
  const pathData = useMemo(
    () => buildSmoothPath(curvePoints),
    [buildSmoothPath, curvePoints],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-border/70 bg-gradient-to-b from-background to-background/95 shadow-[0_24px_70px_hsl(var(--accent)/0.22)]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-wide">
            {t('player.equalizer.title', 'Equalizer')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Controls Row */}
          <div className="grid gap-3 rounded-xl border border-border/60 bg-accent/20 p-3 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-center">
            <div className="flex items-center justify-between rounded-lg border border-border/55 bg-background/70 px-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {t('player.equalizer.title', 'Equalizer')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isEnabled
                    ? t('player.equalizer.enabled', 'Enabled')
                    : t('player.equalizer.disabled', 'Disabled')}
                </span>
              </div>
              <Switch checked={isEnabled} onCheckedChange={handleToggle} />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium whitespace-nowrap">
                {t('player.equalizer.preset', 'Preset')}
              </label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-full min-w-[220px]">
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
            </div>

            <Button variant="outline" size="sm" onClick={handleReset}>
              {t('player.equalizer.reset', 'Reset')}
            </Button>
          </div>

          <div className="relative">
            <div
              className={cn(
                'space-y-5 rounded-xl border border-border/70 bg-gradient-to-b from-accent/25 via-background/80 to-background p-5 transition-all duration-300',
                !isEnabled && 'opacity-55 saturate-50',
              )}
            >
              {/* EQ Curve Visualization */}
              <div className="rounded-lg border border-border/55 bg-background/65 p-4">
                <svg
                  width={SVG_WIDTH}
                  height={SVG_HEIGHT}
                  viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                  className="w-full"
                  style={{ height: 'auto' }}
                >
                  {/* Grid lines */}
                  <line
                    x1="0"
                    y1="35"
                    x2={SVG_WIDTH}
                    y2="35"
                    stroke="hsl(var(--muted-foreground) / 0.3)"
                    strokeWidth="0.75"
                  />
                  <line
                    x1="0"
                    y1="70"
                    x2={SVG_WIDTH}
                    y2="70"
                    stroke="hsl(var(--primary) / 0.9)"
                    strokeWidth="1"
                  />
                  <line
                    x1="0"
                    y1="105"
                    x2={SVG_WIDTH}
                    y2="105"
                    stroke="hsl(var(--muted-foreground) / 0.3)"
                    strokeWidth="0.75"
                  />

                  {/* EQ Curve */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="hsl(var(--primary) / 0.45)"
                    strokeWidth="6"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="blur-[1.5px]"
                  />
                  <path
                    d={pathData}
                    fill="none"
                    stroke="hsl(var(--primary) / 0.95)"
                    strokeWidth="2.8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* EQ Sliders */}
              <div className="grid grid-cols-8 gap-6 px-2">
                {FREQUENCY_BANDS.map((band, index) => (
                  <div
                    key={band.hz}
                    className="flex flex-col items-center gap-3"
                  >
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
                        onChange={(event) =>
                          handleGainChange(index, Number(event.target.value))
                        }
                        disabled={!isEnabled}
                        className={cn(
                          'eq-slider',
                          !isEnabled && 'opacity-35 cursor-not-allowed',
                        )}
                        style={{
                          writingMode: 'bt-lr',
                          WebkitAppearance: 'slider-vertical',
                          accentColor: 'hsl(var(--primary))',
                          width: '48px',
                          height: '192px',
                        }}
                      />
                    </div>

                    <div className="text-xs font-mono text-center min-w-[50px] font-semibold text-[hsl(var(--primary)/0.92)]">
                      {gains[index] > 0 ? '+' : ''}
                      {gains[index]} dB
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!isEnabled && (
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-background/20 via-background/10 to-background/40" />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
