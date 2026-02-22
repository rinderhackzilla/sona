import clsx from 'clsx'
import { PictureInPicture2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import { SimpleTooltip } from '@/app/components/ui/simple-tooltip'
import { useMiniPlayerState } from '@/store/ui.store'

export function MiniPlayerModeButton() {
  const { t } = useTranslation()
  const { open, toggleOpen } = useMiniPlayerState()

  const tooltip = open
    ? t('player.tooltips.miniPlayer.close')
    : t('player.tooltips.miniPlayer.open')

  return (
    <SimpleTooltip text={tooltip}>
      <Button
        variant="ghost"
        size="icon"
        className={clsx(
          'relative z-30 rounded-full w-9 h-9',
          open && 'text-primary hover:text-primary player-button-active',
        )}
        onClick={toggleOpen}
      >
        <PictureInPicture2Icon className="w-4 h-4" />
      </Button>
    </SimpleTooltip>
  )
}
