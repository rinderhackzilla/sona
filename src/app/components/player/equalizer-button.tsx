import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import { SimpleTooltip } from '@/app/components/ui/simple-tooltip'
import { EqualizerIcon } from '@/app/components/icons/equalizer'
import { EqualizerModal } from './equalizer-modal'

interface EqualizerButtonProps {
  disabled: boolean
}

export function EqualizerButton({ disabled }: EqualizerButtonProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <SimpleTooltip text={t('player.tooltips.equalizer', 'Equalizer')}>
        <Button
          variant="ghost"
          className="rounded-full w-10 h-10 p-3 text-secondary-foreground"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          data-testid="equalizer-button"
        >
          <EqualizerIcon className="w-5 h-5" />
        </Button>
      </SimpleTooltip>

      <EqualizerModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
