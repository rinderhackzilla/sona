import { memo } from 'react'
import { MainDrawerPage } from '@/app/components/drawer/page'
import { MiniPlayerModePage } from '@/app/components/mini-player/mode-page'
import { Player } from '@/app/components/player/player'
import { CreatePlaylistDialog } from '@/app/components/playlist/form-dialog'
import { RemovePlaylistDialog } from '@/app/components/playlist/remove-dialog'
import { AppSidebar } from '@/app/components/sidebar/app-sidebar'
import { SongInfoDialog } from '@/app/components/song/info-dialog'
import {
  MainSidebarInset,
  MainSidebarProvider,
} from '@/app/components/ui/main-sidebar'
import { Header } from '@/app/layout/header'
import { useMiniPlayerState } from '@/store/ui.store'
import { MainRoutes } from './main'

const MemoHeader = memo(Header)
const MemoPlayer = memo(Player)
const MemoSongInfoDialog = memo(SongInfoDialog)
const MemoRemovePlaylistDialog = memo(RemovePlaylistDialog)
const MemoMainDrawerPage = memo(MainDrawerPage)
const MemoMiniPlayerModePage = memo(MiniPlayerModePage)

export default function BaseLayout() {
  const { open: miniPlayerOpen } = useMiniPlayerState()

  return (
    <div className="h-screen w-screen overflow-hidden">
      {miniPlayerOpen ? (
        <MemoMiniPlayerModePage />
      ) : (
        <>
          <MainSidebarProvider>
            <MemoHeader />
            <AppSidebar />
            <MainSidebarInset>
              <MainRoutes />
            </MainSidebarInset>
          </MainSidebarProvider>
          <MemoSongInfoDialog />
          <MemoRemovePlaylistDialog />
          <MemoMainDrawerPage />
          <CreatePlaylistDialog />
        </>
      )}
      <MemoPlayer hideUi={miniPlayerOpen} />
    </div>
  )
}
