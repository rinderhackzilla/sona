import { Suspense, useEffect } from 'react'
import { isDesktop } from 'react-device-detect'
import { RouterProvider } from 'react-router-dom'
import { Linux } from '@/app/components/controls/linux'
import { ContextualOnboarding } from '@/app/components/onboarding/contextual-onboarding'
import { SettingsDialog } from '@/app/components/settings/dialog'
import { PlaylistDialogProvider } from '@/app/context/playlist-dialog-context'
import { AlbumColorObserver } from '@/app/observers/album-color-observer'
import { ArtworkPrefetchObserver } from '@/app/observers/artwork-prefetch-observer'
import { DiscoverWeeklyObserver } from '@/app/observers/discover-weekly-observer'
import { LangObserver } from '@/app/observers/lang-observer'
import { LyricsPrefetchObserver } from '@/app/observers/lyrics-prefetch-observer'
import { MediaSessionObserver } from '@/app/observers/media-session-observer'
import { PerformanceHud } from '@/app/observers/performance-hud'
import { SessionModeObserver } from '@/app/observers/session-mode-observer'
import { ThemeObserver } from '@/app/observers/theme-observer'
import { ToastContainer } from '@/app/observers/toast-container'
import { UpdateObserver } from '@/app/observers/update-observer'
import { Mobile } from '@/app/pages/mobile'
import { router } from '@/routes/router'
import { useAppListDensity } from '@/store/app.store'
import { useMiniPlayerState } from '@/store/ui.store'
import { isDesktop as isElectron, isLinux } from '@/utils/desktop'

function App() {
  const { open: miniPlayerOpen } = useMiniPlayerState()
  const { listDensity } = useAppListDensity()

  useEffect(() => {
    document.body.dataset.listDensity = listDensity
  }, [listDensity])

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
        <LyricsPrefetchObserver />
        <PerformanceHud />
        <SettingsDialog />
        <ContextualOnboarding />
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <ToastContainer />
        {isLinux && !miniPlayerOpen && <Linux />}
      </Suspense>
    </PlaylistDialogProvider>
  )
}

export default App
