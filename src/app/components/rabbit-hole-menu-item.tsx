import { Rabbit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRabbitHole } from '@/app/hooks/use-rabbit-hole'
import { ContextMenuItem } from '@/app/components/ui/context-menu'

interface RabbitHoleMenuItemProps {
  type: 'artist' | 'album'
  artistName: string
  artistId?: string
  albumName?: string
  albumId?: string
  onSelect?: () => void
}

export function RabbitHoleMenuItem({
  type,
  artistName,
  artistId,
  albumName,
  albumId,
  onSelect,
}: RabbitHoleMenuItemProps) {
  const { t } = useTranslation()
  const { startRabbitHole, isLoading } = useRabbitHole()

  const handleClick = () => {
    startRabbitHole({
      type,
      artistName,
      artistId,
      albumName,
      albumId,
    })
    onSelect?.()
  }

  return (
    <ContextMenuItem
      onClick={handleClick}
      disabled={isLoading}
      className="gap-2"
    >
      <Rabbit className="h-4 w-4" />
      <span>{t('rabbitHole.button')}</span>
    </ContextMenuItem>
  )
}
