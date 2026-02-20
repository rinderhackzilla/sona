import { useQuery } from '@tanstack/react-query'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import clsx from 'clsx'
import { ListMusic } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyPlaylistsMessage } from '@/app/components/playlist/empty-message'
import { SidebarPlaylistButtons } from '@/app/components/playlist/sidebar-buttons'
import {
  MainSidebarGroupLabel,
  MainSidebarMenu,
  MainSidebarMenuButton,
  MainSidebarMenuItem,
} from '@/app/components/ui/main-sidebar'
import { subsonic } from '@/service/subsonic'
import { usePlaylistOrder } from '@/store/app.store'
import { Playlist } from '@/types/responses/playlist'
import { queryKeys } from '@/utils/queryKeys'
import { SidebarPlaylistItem } from './playlist-item'

/** Sort playlists by the saved ID order; unordered ones go to the end. */
function applySavedOrder(playlists: Playlist[], order: string[]): Playlist[] {
  if (order.length === 0) return playlists
  const indexMap = new Map(order.map((id, i) => [id, i]))
  return [...playlists].sort((a, b) => {
    const ia = indexMap.get(a.id) ?? Infinity
    const ib = indexMap.get(b.id) ?? Infinity
    return ia - ib
  })
}

export function NavPlaylists() {
  const { t } = useTranslation()
  const { playlistOrder, setPlaylistOrder } = usePlaylistOrder()
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null)

  const { data: playlists } = useQuery({
    queryKey: [queryKeys.playlist.all],
    queryFn: subsonic.playlists.getAll,
  })

  const sortedPlaylists = useMemo(
    () => (playlists ? applySavedOrder(playlists, playlistOrder) : []),
    [playlists, playlistOrder],
  )

  const hasPlaylists = sortedPlaylists.length > 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    const found = sortedPlaylists.find((p) => p.id === event.active.id)
    setActivePlaylist(found ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActivePlaylist(null)
    if (!over || active.id === over.id) return

    const fromIndex = sortedPlaylists.findIndex((p) => p.id === active.id)
    const toIndex = sortedPlaylists.findIndex((p) => p.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return

    const reordered = [...sortedPlaylists]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    setPlaylistOrder(reordered.map((p) => p.id))
  }

  return (
    <div className="px-4 pb-4">
      <div
        className={clsx(
          'flex items-center justify-between mb-2 mt-4',
          'transition-opacity group-data-[collapsible=icon]:opacity-0',
          'group-data-[collapsible=icon]:pointer-events-none',
        )}
      >
        <MainSidebarGroupLabel>{t('sidebar.playlists')}</MainSidebarGroupLabel>
        <SidebarPlaylistButtons />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedPlaylists.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <MainSidebarMenu>
            {hasPlaylists &&
              sortedPlaylists.map((playlist) => (
                <SidebarPlaylistItem key={playlist.id} playlist={playlist} />
              ))}

            {!hasPlaylists && <EmptyPlaylistsMessage />}
          </MainSidebarMenu>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activePlaylist ? (
            <MainSidebarMenuItem>
              <MainSidebarMenuButton className="pl-6 bg-accent/80 shadow-lg cursor-grabbing">
                <ListMusic className="w-4 h-4 shrink-0" />
                <span className="truncate">{activePlaylist.name}</span>
              </MainSidebarMenuButton>
            </MainSidebarMenuItem>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
