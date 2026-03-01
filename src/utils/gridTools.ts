import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from '@/utils/safe-storage'

export type GridViewWrapperType = 'artists' | 'albums' | 'genres'

type SavedGridItem = Record<string, number>

type SaveGridItemParams = {
  name: GridViewWrapperType
  offsetTop: number
  routeKey: string
}

export function saveGridClickedItem(params: SaveGridItemParams) {
  const { name, offsetTop, routeKey } = params

  const itemName = `grid_${name}_last_row_index`
  const saved = getGridClickedItem({ name })
  let value: SavedGridItem = {}

  if (saved) {
    value = {
      ...saved,
      [routeKey]: offsetTop,
    }
  } else {
    value = { [routeKey]: offsetTop }
  }

  safeStorageSet(itemName, JSON.stringify(value))
}

type GetGridItemParams = {
  name: GridViewWrapperType
}

export function getGridClickedItem(params: GetGridItemParams) {
  const { name } = params
  const itemName = `grid_${name}_last_row_index`

  const saved = safeStorageGet(itemName)
  if (!saved) return null

  let value: SavedGridItem
  try {
    value = JSON.parse(saved) as SavedGridItem
  } catch {
    return null
  }

  return value
}

export function resetGridClickedItem(params: GetGridItemParams) {
  const { name } = params
  const itemName = `grid_${name}_last_row_index`

  safeStorageRemove(itemName)
}
