import clsx from 'clsx'
import { SlidersHorizontal } from 'lucide-react'
import { ComponentPropsWithoutRef, createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import { Separator } from '@/app/components/ui/separator'
import { Slider } from '@/app/components/ui/slider'
import { Switch } from '@/app/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { VISUALIZER_NAMES } from '@/app/components/fullscreen/visualizers'
import { cn } from '@/lib/utils'
import { useSongColor } from '@/store/player.store'
import type { VisualizerPreset } from '@/types/visualizer'
import { buttonsStyle } from './controls'

// Context for visualizer state (POC - will move to store)
type VisualizerContextType = {
  preset: VisualizerPreset
  setPreset: (preset: VisualizerPreset) => void
  hypnoticBackdropEnabled: boolean
  setHypnoticBackdropEnabled: (enabled: boolean) => void
}

const VisualizerContext = createContext<VisualizerContextType | null>(null)

export function useVisualizerContext() {
  const context = useContext(VisualizerContext)
  if (!context) {
    throw new Error('useVisualizerContext must be used within VisualizerProvider')
  }
  return context
}

// Hook for visualizer settings (colors, etc.)
export function useVisualizerSettings() {
  const { currentSongColor } = useSongColor()
  
  return {
    primaryColor: currentSongColor || '#3b82f6',
    secondaryColor: '#8b5cf6',
  }
}

export function VisualizerProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = useState<VisualizerPreset>('geometric-mandala')
  const [hypnoticBackdropEnabled, setHypnoticBackdropEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    const value = window.localStorage.getItem('sona.fullscreen.hypnoticBackdrop')
    return value === null ? true : value === 'true'
  })

  const setHypnoticBackdropEnabledWithPersistence = (enabled: boolean) => {
    setHypnoticBackdropEnabled(enabled)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sona.fullscreen.hypnoticBackdrop', String(enabled))
    }
  }

  return (
    <VisualizerContext.Provider
      value={{
        preset,
        setPreset,
        hypnoticBackdropEnabled,
        setHypnoticBackdropEnabled: setHypnoticBackdropEnabledWithPersistence,
      }}
    >
      {children}
    </VisualizerContext.Provider>
  )
}

export function FullscreenSettings() {
  const { useSongColorOnBigPlayer } = useSongColor()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={clsx(
            buttonsStyle.utility,
            'data-[state=open]:scale-110',
          )}
          style={{ ...buttonsStyle.style }}
        >
          <SlidersHorizontal className={buttonsStyle.secondaryIcon} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <div className="flex flex-col">
          <DynamicColorOption showSeparator={false} />
          <HypnoticBackdropOption />
          {useSongColorOnBigPlayer && <ColorIntensityOption />}
          {!useSongColorOnBigPlayer && <ImageBlurSizeOption />}
          <VisualizerPresetOption />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function QueueSettings() {
  const { useSongColorOnQueue } = useSongColor()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-full hover:bg-foreground/20 data-[state=open]:bg-foreground/20"
        >
          <SlidersHorizontal className="size-4" strokeWidth={2.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-104 p-0" align="end" side="bottom">
        <div className="flex flex-col">
          <QueueDynamicColorOption showSeparator={false} />
          {useSongColorOnQueue && <ColorIntensityOption />}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type OptionProps = Omit<ComponentPropsWithoutRef<typeof SettingWrapper>, 'text'>

function DynamicColorOption(props: OptionProps) {
  const { t } = useTranslation()
  const { useSongColorOnBigPlayer, setUseSongColorOnBigPlayer } = useSongColor()

  return (
    <SettingWrapper text={t('settings.appearance.colors.group')} {...props}>
      <Switch
        checked={useSongColorOnBigPlayer}
        onCheckedChange={() =>
          setUseSongColorOnBigPlayer(!useSongColorOnBigPlayer)
        }
      />
    </SettingWrapper>
  )
}

function QueueDynamicColorOption(props: OptionProps) {
  const { t } = useTranslation()
  const { useSongColorOnQueue, setUseSongColorOnQueue } = useSongColor()

  return (
    <SettingWrapper text={t('settings.appearance.colors.group')} {...props}>
      <Switch
        checked={useSongColorOnQueue}
        onCheckedChange={() => setUseSongColorOnQueue(!useSongColorOnQueue)}
      />
    </SettingWrapper>
  )
}

function ColorIntensityOption(props: OptionProps) {
  const { t } = useTranslation()
  const { currentSongColorIntensity, setCurrentSongIntensity } = useSongColor()

  const intensityTooltip = `${Math.round(currentSongColorIntensity * 100)}%`

  return (
    <SettingWrapper
      text={t('settings.appearance.colors.queue.intensity')}
      {...props}
    >
      <Slider
        defaultValue={[currentSongColorIntensity]}
        min={0.3}
        max={1.0}
        step={0.05}
        tooltipValue={intensityTooltip}
        onValueChange={([value]) => setCurrentSongIntensity(value)}
      />
    </SettingWrapper>
  )
}

function HypnoticBackdropOption(props: OptionProps) {
  const { t } = useTranslation()
  const { hypnoticBackdropEnabled, setHypnoticBackdropEnabled } = useVisualizerContext()

  return (
    <SettingWrapper text={t('fullscreen.hypnoticBackdrop')} {...props}>
      <Switch
        checked={hypnoticBackdropEnabled}
        onCheckedChange={setHypnoticBackdropEnabled}
      />
    </SettingWrapper>
  )
}

function ImageBlurSizeOption(props: OptionProps) {
  const { t } = useTranslation()
  const { bigPlayerBlur, setBigPlayerBlurValue } = useSongColor()

  return (
    <SettingWrapper
      text={t('settings.appearance.colors.bigPlayer.blurSize')}
      {...props}
    >
      <Slider
        defaultValue={[bigPlayerBlur.value]}
        min={bigPlayerBlur.settings.min}
        max={bigPlayerBlur.settings.max}
        step={bigPlayerBlur.settings.step}
        tooltipValue={`${bigPlayerBlur.value}px`}
        onValueChange={([value]) => setBigPlayerBlurValue(value)}
      />
    </SettingWrapper>
  )
}

function VisualizerPresetOption({ showSeparator = true }: OptionProps) {
  const context = useContext(VisualizerContext)

  if (!context) {
    return null
  }

  const { preset, setPreset } = context

  return (
    <>
      {showSeparator && <Separator />}
      <div className="flex items-center gap-3 p-3">
        <span className="text-sm shrink-0">Visualizer</span>
        <Select value={preset} onValueChange={(value) => setPreset(value as VisualizerPreset)}>
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(VISUALIZER_NAMES) as VisualizerPreset[]).map((key) => (
              <SelectItem key={key} value={key}>
                {VISUALIZER_NAMES[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

type SettingWrapperProps = ComponentPropsWithoutRef<'div'> & {
  text: string
  showSeparator?: boolean
  contentClassName?: string
}

function SettingWrapper({
  text,
  className,
  contentClassName,
  children,
  showSeparator = true,
  ...props
}: SettingWrapperProps) {
  return (
    <>
      {showSeparator && <Separator />}
      <div
        className={cn('flex items-center justify-between p-3', className)}
        {...props}
      >
        <span className="text-sm flex-1 text-balance">{text}</span>
        <div className={cn('w-2/5 flex items-center justify-end', contentClassName)}>{children}</div>
      </div>
    </>
  )
}
