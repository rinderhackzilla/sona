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
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>✓ Playlist gespeichert</AlertDialogTitle>
          <AlertDialogDescription>
            Deine personalisierte <strong>{playlistName}</strong> wurde
            erfolgreich aktualisiert!
            {trackCount > 0 && (
              <>
                <br />
                <br />
                <span className="text-sm text-muted-foreground">
                  {trackCount} {trackCount === 1 ? 'Track' : 'Tracks'} verfügbar
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
