import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { PlaylistSavedDialog } from '@/app/components/dialogs/playlist-saved-dialog'

interface PlaylistDialogState {
  isOpen: boolean
  playlistName: string
  trackCount: number
}

interface PlaylistDialogContextValue {
  showPlaylistSaved: (playlistName: string, trackCount: number) => void
}

const PlaylistDialogContext = createContext<PlaylistDialogContextValue | null>(
  null,
)

export function PlaylistDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<PlaylistDialogState>({
    isOpen: false,
    playlistName: '',
    trackCount: 0,
  })

  const showPlaylistSaved = useCallback(
    (playlistName: string, trackCount: number) => {
      setDialog({
        isOpen: true,
        playlistName,
        trackCount,
      })
    },
    [],
  )

  const handleClose = useCallback(() => {
    setDialog((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return (
    <PlaylistDialogContext.Provider value={{ showPlaylistSaved }}>
      {children}
      <PlaylistSavedDialog
        open={dialog.isOpen}
        onClose={handleClose}
        playlistName={dialog.playlistName}
        trackCount={dialog.trackCount}
      />
    </PlaylistDialogContext.Provider>
  )
}

export function usePlaylistDialog() {
  const context = useContext(PlaylistDialogContext)
  if (!context) {
    throw new Error(
      'usePlaylistDialog must be used within PlaylistDialogProvider',
    )
  }
  return context
}
