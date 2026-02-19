import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { EmptyPlaylistsMessage } from '@/app/components/playlist/empty-message'
import { SidebarPlaylistButtons } from '@/app/components/playlist/sidebar-buttons'
import {
  MainSidebarContent,
  MainSidebarGroupLabel,
  MainSidebarMenu,
} from '@/app/components/ui/main-sidebar'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { subsonic } from '@/service/subsonic'
import { queryKeys } from '@/utils/queryKeys'
import { SidebarPlaylistItem } from './playlist-item'

export function NavPlaylists() {
  const { t } = useTranslation()

  const { data: playlists } = useQuery({
    queryKey: [queryKeys.playlist.all],
    queryFn: subsonic.playlists.getAll,
  })

  const hasPlaylists = playlists !== undefined && playlists.length > 0

  return (
    <MainSidebarContent className="flex flex-col min-h-0">
      <div
        className={clsx(
          'flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0',
          'transition-opacity group-data-[collapsible=icon]:opacity-0',
          'group-data-[collapsible=icon]:pointer-events-none',
        )}
      >
        <MainSidebarGroupLabel>{t('sidebar.playlists')}</MainSidebarGroupLabel>
        <SidebarPlaylistButtons />
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <MainSidebarMenu className="pb-4">
          {hasPlaylists &&
            playlists.map((playlist) => (
              <SidebarPlaylistItem key={playlist.id} playlist={playlist} />
            ))}

          {!hasPlaylists && <EmptyPlaylistsMessage />}
        </MainSidebarMenu>
      </ScrollArea>
    </MainSidebarContent>
  )
}
