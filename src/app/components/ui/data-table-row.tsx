import { Cell, flexRender, Row } from '@tanstack/react-table'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { GripVerticalIcon } from 'lucide-react'
import { ComponentPropsWithoutRef, memo, ReactNode, useMemo } from 'react'
import { ContextMenuProvider } from '@/app/components/table/context-menu'
import { usePlayerCurrentSong } from '@/store/player.store'
import { ColumnDefType } from '@/types/react-table/columnDef'

interface RowProps<TData> extends ComponentPropsWithoutRef<'div'> {
  index: number
  row: Row<TData>
  contextMenuOptions: ReactNode
  isPrevRowSelected: (rowIndex: number) => boolean
  isNextRowSelected: (rowIndex: number) => boolean
  variant?: 'classic' | 'modern'
  dataType?: 'song' | 'artist' | 'playlist' | 'radio'
  sortableId?: string
}

const MemoContextMenuProvider = memo(ContextMenuProvider)
const MemoTableCell = memo(TableCell) as typeof TableCell

export function TableRow<TData>({
  index,
  row,
  contextMenuOptions,
  variant,
  dataType,
  isPrevRowSelected,
  isNextRowSelected,
  sortableId,
  ...props
}: RowProps<TData>) {
  const currentSong = usePlayerCurrentSong()

  const isClassic = variant === 'classic'
  const isModern = variant === 'modern'
  const isSortable = !!sortableId

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId ?? '__disabled__', disabled: !isSortable })

  const isRowSongActive = useMemo(() => {
    if (dataType !== 'song') return false

    // @ts-expect-error row type
    return row.original.id === currentSong.id
  }, [currentSong.id, dataType, row.original])

  const sortableStyle = isSortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : {}

  return (
    <MemoContextMenuProvider options={contextMenuOptions}>
      <div
        ref={isSortable ? setNodeRef : undefined}
        style={sortableStyle}
        {...props}
        role="row"
        data-test-id="table-row"
        data-state={row.getIsSelected() && 'selected'}
        className={clsx(
          'group/tablerow w-full flex flex-row transition-colors',
          isModern &&
            row.getIsSelected() &&
            !isPrevRowSelected(index) &&
            'rounded-t-md',
          isModern &&
            row.getIsSelected() &&
            !isNextRowSelected(index) &&
            'rounded-b-md',
          isModern && !row.getIsSelected() && 'rounded-md',
          'hover:bg-foreground/20 data-[state=selected]:bg-foreground/30',
          isClassic && 'border-b',
          isRowSongActive && isModern && 'row-active bg-foreground/20',
          isSortable && isDragging && 'opacity-30',
        )}
      >
        {isSortable && (
          <div
            {...attributes}
            {...listeners}
            className="w-6 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-foreground/30 hover:text-foreground/70 opacity-0 group-hover/tablerow:opacity-100 transition-opacity"
          >
            <GripVerticalIcon className="w-4 h-4" />
          </div>
        )}
        {row.getVisibleCells().map((cell) => (
          <MemoTableCell key={cell.id} cell={cell} />
        ))}
      </div>
    </MemoContextMenuProvider>
  )
}

interface TableCellProps<TData, TValue> {
  cell: Cell<TData, TValue>
}

function TableCell<TData, TValue>({ cell }: TableCellProps<TData, TValue>) {
  const columnDef = cell.column.columnDef as ColumnDefType<TData>

  return (
    <div
      key={cell.id}
      className={clsx(
        'p-2 flex flex-row items-center justify-start [&:has([role=checkbox])]:pr-4',
        columnDef.className,
      )}
      style={columnDef.style}
      role="cell"
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </div>
  )
}
