import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useVirtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'
import { GripVerticalIcon, MoonStarIcon, SparklesIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PlaySongButton from '@/app/components/table/play-button'
import { QueueActions } from '@/app/components/table/queue-actions'
import { TableSongTitle } from '@/app/components/table/song-title'
import {
  ScrollArea,
  scrollAreaViewportSelector,
} from '@/app/components/ui/scroll-area'
import { ROUTES } from '@/routes/routesList'
import {
  usePlayerActions,
  usePlayerCurrentSong,
  usePlayerStore,
} from '@/store/player.store'
import { ISong } from '@/types/responses/song'
import { convertSecondsToTime } from '@/utils/convertSecondsToTime'

// ─── Individual sortable row ──────────────────────────────────────────────────

interface SortableQueueRowProps {
  song: ISong
  songIndex: number
  virtualStart: number
  virtualSize: number
  songs: ISong[]
  isOverlay?: boolean
}

function SortableQueueRow({
  song,
  songIndex,
  virtualStart,
  virtualSize,
  songs,
  isOverlay = false,
}: SortableQueueRowProps) {
  const { t } = useTranslation()
  const { setSongList } = usePlayerActions()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id, disabled: isOverlay })

  const currentSong = usePlayerCurrentSong()
  const isActive = song.id === currentSong.id
  const { closeDrawer } = usePlayerStore.getState().actions
  const sourceLabel =
    song.queueSource === 'dj'
      ? t('queue.source.dj')
      : song.queueSource === 'session'
        ? t('queue.source.session')
        : null

  const outerStyle = isOverlay
    ? { height: virtualSize, width: 'calc(100% - 12px)' }
    : {
        position: 'absolute' as const,
        top: virtualStart,
        height: virtualSize,
        width: 'calc(100% - 12px)',
        transform: CSS.Transform.toString(transform),
        transition,
      }

  return (
    <div ref={isOverlay ? undefined : setNodeRef} style={outerStyle}>
      <div
        className={clsx(
          'group/tablerow w-full flex flex-row items-center rounded-md h-14 transition-colors select-none',
          isDragging && !isOverlay
            ? 'opacity-20 bg-foreground/5'
            : 'hover:bg-foreground/20',
          isOverlay &&
            'shadow-xl border border-foreground/20 bg-popover cursor-grabbing',
          isActive && !isDragging && 'row-active bg-foreground/20',
        )}
      >
        {/* Drag handle */}
        <div className="w-6 shrink-0 ml-1 relative flex items-center justify-center">
          {!isOverlay && song.queueSource === 'dj' && (
            <SparklesIcon
              className="absolute w-3.5 h-3.5 text-foreground/60 transition-opacity group-hover/tablerow:opacity-0"
              title={sourceLabel ?? undefined}
            />
          )}
          {!isOverlay && song.queueSource === 'session' && (
            <MoonStarIcon
              className="absolute w-3.5 h-3.5 text-foreground/60 transition-opacity group-hover/tablerow:opacity-0"
              title={sourceLabel ?? undefined}
            />
          )}
          <div
            {...(isOverlay ? {} : { ...attributes, ...listeners })}
            className={clsx(
              'absolute flex items-center justify-center text-foreground/40 hover:text-foreground/70',
              isOverlay
                ? 'cursor-grabbing'
                : 'cursor-grab active:cursor-grabbing opacity-0 group-hover/tablerow:opacity-100 transition-opacity',
            )}
          >
            <GripVerticalIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Play button */}
        <div className="w-9 min-w-9 flex items-center p-1">
          <PlaySongButton
            trackNumber={songIndex + 1}
            trackId={song.id}
            handlePlayButton={() => setSongList(songs, songIndex)}
          />
        </div>

        {/* Title + artist */}
        <div className="flex-1 min-w-0 p-2 flex items-center gap-1.5">
          <TableSongTitle song={song} />
        </div>

        {/* Album (hidden on small screens) */}
        <div className="hidden xl:flex w-[22%] min-w-[14%] max-w-[24%] p-2 overflow-hidden">
          <Link
            to={ROUTES.ALBUM.PAGE(song.albumId)}
            className="hover:underline truncate text-foreground/70 hover:text-foreground text-sm"
            onClick={closeDrawer}
            onContextMenu={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            tabIndex={-1}
          >
            {song.album}
          </Link>
        </div>

        {/* Duration */}
        <div className="w-16 max-w-16 min-w-16 p-1.5 text-sm text-foreground/70 shrink-0 text-right">
          {convertSecondsToTime(song.duration ?? 0)}
        </div>

        {/* Remove */}
        <div className="w-[52px] max-w-[52px] min-w-[52px] p-1.5 flex items-center justify-center">
          <QueueActions row={{ original: song } as never} />
        </div>
      </div>
    </div>
  )
}

// ─── Container ───────────────────────────────────────────────────────────────

interface SortableQueueListProps {
  songs: ISong[]
  currentSongIndex: number
  scrollToIndex?: boolean
}

export function SortableQueueList({
  songs,
  currentSongIndex,
  scrollToIndex = false,
}: SortableQueueListProps) {
  const { reorderQueue } = usePlayerActions()
  const [activeId, setActiveId] = useState<string | null>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const getScrollElement = useCallback(() => {
    if (!parentRef.current) return null
    return parentRef.current.querySelector(scrollAreaViewportSelector)
  }, [])

  const virtualizer = useVirtualizer({
    count: songs.length,
    getScrollElement,
    estimateSize: () => 56,
    overscan: 5,
  })

  useEffect(() => {
    if (!scrollToIndex || !currentSongIndex) return
    virtualizer.scrollToIndex(currentSongIndex, { align: 'start' })
  }, [currentSongIndex, scrollToIndex, virtualizer])

  const activeSong = activeId ? songs.find((s) => s.id === activeId) : null
  const activeIndex = activeSong ? songs.indexOf(activeSong) : -1

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const fromIndex = songs.findIndex((s) => s.id === active.id)
    const toIndex = songs.findIndex((s) => s.id === over.id)

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderQueue(fromIndex, toIndex)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={songs.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <ScrollArea
          ref={parentRef}
          type="always"
          className="h-full pr-1 [&_div:last-child]:border-0"
          thumbClassName="secondary-thumb-bar"
        >
          <div
            className="w-full relative"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const song = songs[virtualRow.index]
              return (
                <SortableQueueRow
                  key={song.id}
                  song={song}
                  songIndex={virtualRow.index}
                  virtualStart={virtualRow.start}
                  virtualSize={virtualRow.size}
                  songs={songs}
                />
              )
            })}
          </div>
        </ScrollArea>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeSong ? (
          <SortableQueueRow
            song={activeSong}
            songIndex={activeIndex}
            virtualStart={0}
            virtualSize={56}
            songs={songs}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
