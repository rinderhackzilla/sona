import { PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import { SimpleTooltip } from '@/app/components/ui/simple-tooltip'
import { usePlaylists } from '@/store/playlists.store'

export function SidebarPlaylistButtons() {
  const { setPlaylistDialogState } = usePlaylists()
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2">
      <SimpleTooltip text={t('playlist.form.create.title')}>
        <Button
          size="icon"
          variant="secondary"
          className="h-5.5 w-5.5 p-1"
          onClick={() => setPlaylistDialogState(true)}
        >
          <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.75} />
        </Button>
      </SimpleTooltip>
    </div>
  )
}
