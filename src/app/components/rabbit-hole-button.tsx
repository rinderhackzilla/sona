import { Rabbit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRabbitHole } from '@/app/hooks/use-rabbit-hole'
import { Button } from '@/app/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip'
import { cn } from '@/utils/cn'

interface RabbitHoleButtonProps {
  type: 'artist' | 'album'
  artistName: string
  artistId?: string
  albumName?: string
  albumId?: string
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function RabbitHoleButton({
  type,
  artistName,
  artistId,
  albumName,
  albumId,
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: RabbitHoleButtonProps) {
  const { t } = useTranslation()
  const { startRabbitHole, isLoading } = useRabbitHole()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startRabbitHole({
      type,
      artistName,
      artistId,
      albumName,
      albumId,
    })
  }

  const tooltipText = t('rabbitHole.tooltip')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isLoading}
            className={cn(
              'transition-all hover:scale-110',
              isLoading && 'opacity-50 cursor-wait',
              className,
            )}
          >
            <Rabbit
              className={cn(
                'h-5 w-5',
                isLoading && 'animate-pulse',
              )}
            />
            {showLabel && (
              <span className="ml-2">{t('rabbitHole.button')}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
