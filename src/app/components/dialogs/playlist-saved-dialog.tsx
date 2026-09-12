import { Trans, useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'

interface PlaylistSavedDialogProps {
  open: boolean
  onClose: () => void
  playlistName: string
  trackCount: number
}

export function PlaylistSavedDialog({
  open,
  onClose,
  playlistName,
  trackCount,
}: PlaylistSavedDialogProps) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('playlist.form.saved.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans
              i18nKey="playlist.form.saved.description"
              values={{ playlistName }}
              components={{ 1: <strong /> }}
            />
            {trackCount > 0 && (
              <>
                <br />
                <br />
                <span className="text-sm text-muted-foreground">
                  {t('playlist.form.saved.tracks', { count: trackCount })}
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
