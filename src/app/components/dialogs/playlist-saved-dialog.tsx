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
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>✓ Playlist gespeichert</AlertDialogTitle>
          <AlertDialogDescription>
            Deine personalisierte <strong>{playlistName}</strong> Playlist wurde erfolgreich aktualisiert!
            <br />
            <br />
            {trackCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {trackCount} {trackCount === 1 ? 'Track' : 'Tracks'} verfügbar
              </span>
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
