import { isDesktop } from 'react-device-detect'
import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Linux } from '@/app/components/controls/linux'
import { SettingsDialog } from '@/app/components/settings/dialog'
import { AlbumColorObserver } from '@/app/observers/album-color-observer'
import { DiscoverWeeklyObserver } from '@/app/observers/discover-weekly-observer'
import { LangObserver } from '@/app/observers/lang-observer'
import { MediaSessionObserver } from '@/app/observers/media-session-observer'
import { ThemeObserver } from '@/app/observers/theme-observer'
import { ToastContainer } from '@/app/observers/toast-container'
import { UpdateObserver } from '@/app/observers/update-observer'
import { SessionModeObserver } from '@/app/observers/session-mode-observer'
import { PerformanceHud } from '@/app/observers/performance-hud'
import { ArtworkPrefetchObserver } from '@/app/observers/artwork-prefetch-observer'
import { PlaylistDialogProvider } from '@/app/context/playlist-dialog-context'
import { Mobile } from '@/app/pages/mobile'
import { router } from '@/routes/router'
import { useMiniPlayerState } from '@/store/ui.store'
import { isDesktop as isElectron, isLinux } from '@/utils/desktop'

function App() {
  const { open: miniPlayerOpen } = useMiniPlayerState()

  if (!isDesktop && window.innerHeight > window.innerWidth) return <Mobile /> // Support tablets but not phones

  return (
    <PlaylistDialogProvider>
      <Suspense fallback={null}>
        {isElectron() && <UpdateObserver />}
        {isElectron() && <DiscoverWeeklyObserver />}
        <MediaSessionObserver />
        <AlbumColorObserver />
        <LangObserver />
        <ThemeObserver />
        <SessionModeObserver />
        <ArtworkPrefetchObserver />
        <PerformanceHud />
        <SettingsDialog />
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <ToastContainer />
        {isLinux && !miniPlayerOpen && <Linux />}
      </Suspense>
    </PlaylistDialogProvider>
  )
}

export default App
