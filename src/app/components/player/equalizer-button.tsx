import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import { SimpleTooltip } from '@/app/components/ui/simple-tooltip'
import { EqualizerIcon } from '@/app/components/icons/equalizer-icon'
import { EqualizerModal } from './equalizer-modal'

interface EqualizerButtonProps {
  disabled: boolean
}

export function EqualizerButton({ disabled }: EqualizerButtonProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <SimpleTooltip text={t('player.tooltips.equalizer')} disabled={disabled}>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className="h-10 w-10 p-2.5 text-secondary-foreground hover:text-primary"
          data-testid="equalizer-button"
        >
          <EqualizerIcon />
        </Button>
      </SimpleTooltip>

      <EqualizerModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
