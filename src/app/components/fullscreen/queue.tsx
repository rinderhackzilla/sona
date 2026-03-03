import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import {
  usePlayerActions,
  usePlayerIsPlaying,
  usePlayerSonglist,
} from '@/store/player.store'
import { QueueItem } from './queue-item'

type SortableFullscreenQueueItemProps = {
  index: number
  isPlaying: boolean
  isActive: boolean
  virtualStart: number
}

function SortableFullscreenQueueItem({
  index,
  isPlaying,
  isActive,
  virtualStart,
}: SortableFullscreenQueueItemProps) {
  const { setSongList } = usePlayerActions()
  const { currentList, currentSong } = usePlayerSonglist()

  const song = currentList[index]
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id })

  return (
    <QueueItem
      ref={setNodeRef}
      data-row-index={index}
      data-state={isActive ? 'active' : 'inactive'}
      index={index}
      song={song}
      isPlaying={isPlaying}
      onClick={() => {
        if (currentSong.id !== song.id) {
          setSongList(currentList, index)
        }
      }}
      style={{
        position: 'absolute',
        top: 0,
        width: '100%',
        transform: `translate3d(${transform?.x ?? 0}px, ${virtualStart + (transform?.y ?? 0)}px, 0)`,
        transition,
        opacity: isDragging ? 0.4 : undefined,
      }}
      className={
        isDragging ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
      }
      {...attributes}
      {...listeners}
    />
  )
}

export function FullscreenSongQueue() {
  const { reorderQueue } = usePlayerActions()
  const { currentList, currentSongIndex, currentSong } = usePlayerSonglist()
  const isPlaying = usePlayerIsPlaying()

  const parentRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const getScrollElement = () => {
    if (!parentRef.current) return null

    return parentRef.current.querySelector('[data-radix-scroll-area-viewport]')
  }

  const virtualizer = useVirtualizer({
    count: currentList.length,
    getScrollElement,
    estimateSize: () => 64,
    overscan: 5,
  })

  useEffect(() => {
    if (currentSongIndex >= 0) {
      virtualizer.scrollToIndex(currentSongIndex, { align: 'start' })
    }
  }, [currentSongIndex, virtualizer])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const fromIndex = currentList.findIndex((song) => song.id === active.id)
    const toIndex = currentList.findIndex((song) => song.id === over.id)

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderQueue(fromIndex, toIndex)
    }
  }

  if (currentList.length === 0)
    return (
      <div className="flex justify-center items-center">
        <span>No songs in queue</span>
      </div>
    )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={currentList.map((song) => song.id)}
        strategy={verticalListSortingStrategy}
      >
        <ScrollArea
          ref={parentRef}
          type="always"
          className="min-h-full h-full overflow-auto"
          thumbClassName="secondary-thumb-bar"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <SortableFullscreenQueueItem
                key={currentList[virtualRow.index].id}
                index={virtualRow.index}
                isActive={currentSong.id === currentList[virtualRow.index].id}
                isPlaying={
                  currentSong.id === currentList[virtualRow.index].id &&
                  isPlaying
                }
                virtualStart={virtualRow.start}
              />
            ))}
          </div>
        </ScrollArea>
      </SortableContext>
    </DndContext>
  )
}
