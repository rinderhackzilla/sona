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
}

const VisualizerContext = createContext<VisualizerContextType | null>(null)

export function useVisualizerContext() {
  const context = useContext(VisualizerContext)
  if (!context) {
    throw new Error('useVisualizerContext must be used within VisualizerProvider')
  }
  return context
}

export function VisualizerProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = useState<VisualizerPreset>('frequency-circle')
  return (
    <VisualizerContext.Provider value={{ preset, setPreset }}>
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
            buttonsStyle.secondary,
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
      <PopoverContent className="w-80 p-0" align="end" side="bottom">
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

function VisualizerPresetOption(props: OptionProps) {
  const context = useContext(VisualizerContext)
  
  // Graceful fallback if no context
  if (!context) {
    return null
  }

  const { preset, setPreset } = context

  return (
    <SettingWrapper text="Visualizer" {...props}>
      <Select value={preset} onValueChange={(value) => setPreset(value as VisualizerPreset)}>
        <SelectTrigger className="w-full">
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
    </SettingWrapper>
  )
}

type SettingWrapperProps = ComponentPropsWithoutRef<'div'> & {
  text: string
  showSeparator?: boolean
}

function SettingWrapper({
  text,
  className,
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
        <div className="w-2/5 flex items-center justify-end">{children}</div>
      </div>
    </>
  )
}
