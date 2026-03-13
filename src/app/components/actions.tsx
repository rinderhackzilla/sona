import clsx from 'clsx'
import {
  EllipsisVertical,
  Heart,
  Info,
  Pause,
  Play,
  Shuffle,
} from 'lucide-react'
import { ButtonHTMLAttributes, ComponentPropsWithoutRef } from 'react'
import { Button as ComponentButton } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { SimpleTooltip } from '@/app/components/ui/simple-tooltip'
import { cn } from '@/lib/utils'

type ActionsContainerProps = ComponentPropsWithoutRef<'div'>

function Container({ children, className, ...rest }: ActionsContainerProps) {
  return (
    <div
      {...rest}
      className={cn('mb-6 flex w-full items-center gap-2', className)}
    >
      {children}
    </div>
  )
}

interface ActionsMainButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string
  buttonStyle?: 'primary' | 'secondary'
  isActive?: boolean
}

function Button({
  children,
  tooltip,
  buttonStyle = 'secondary',
  isActive = false,
  className,
  ...props
}: ActionsMainButtonProps) {
  const button = (
    <ComponentButton
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(
        'h-14 w-14 rounded-full border border-transparent transition-all duration-150',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        'data-[state=active]:bg-foreground/12 data-[state=active]:border-border/60',
        buttonStyle === 'primary'
          ? 'mr-2 hover:scale-105'
          : 'hover:bg-foreground/20',
        className,
      )}
      variant={buttonStyle === 'primary' ? 'default' : 'ghost'}
      {...props}
    >
      {children}
    </ComponentButton>
  )

  if (!tooltip) return button

  return <SimpleTooltip text={tooltip}>{button}</SimpleTooltip>
}

interface DropdownProps {
  tooltip: string
  options?: React.ReactNode
}

function Dropdown({ tooltip, options }: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className="outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent focus:ring-transparent"
      >
        <ComponentButton
          className={clsx(
            'h-14 w-14 rounded-full border border-transparent',
            'data-[state=open]:bg-foreground/20',
            'hover:bg-foreground/20',
            'transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
          )}
          variant="ghost"
        >
          <SimpleTooltip text={tooltip}>
            <div className="min-w-14 h-14 rounded-full flex justify-center items-center">
              <EllipsisIcon />
            </div>
          </SimpleTooltip>
        </ComponentButton>
      </DropdownMenuTrigger>
      {options && (
        <DropdownMenuContent className="min-w-56" align="start">
          {options}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}

function PlayIcon() {
  return <Play className="w-6 h-6 fill-primary-foreground" strokeWidth={2} />
}

function PauseIcon() {
  return <Pause className="w-5 h-5 fill-primary-foreground" />
}

function ShuffleIcon() {
  return <Shuffle className="w-5 h-5 drop-shadow-md" strokeWidth={2} />
}

interface LikeIconProps {
  isStarred?: boolean
}

function LikeIcon({ isStarred }: LikeIconProps) {
  return (
    <Heart
      className={clsx(
        'w-5 h-5 drop-shadow-md',
        isStarred && 'text-red-500 fill-red-500',
      )}
      strokeWidth={2}
    />
  )
}

function InfoIcon() {
  return <Info className="w-5 h-5 drop-shadow-md" strokeWidth={2} />
}

function EllipsisIcon() {
  return <EllipsisVertical className="w-5 h-5 drop-shadow-md" strokeWidth={2} />
}

export const Actions = {
  Container,
  Button,
  PlayIcon,
  PauseIcon,
  ShuffleIcon,
  LikeIcon,
  InfoIcon,
  EllipsisIcon,
  Dropdown,
}
