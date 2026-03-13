import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/routes/routesList'

export function useRouteIsActive() {
  const location = useLocation()
  const currentPath = location.pathname
  const currentSearch = location.search

  const isActive = useCallback(
    (route: string) => {
      const [rawPath, rawQuery] = route.split('?')
      const routePath = normalizePath(rawPath)
      const path = normalizePath(currentPath)

      if (routePath === '/') {
        if (path !== '/') return false
      } else if (path !== routePath && !path.startsWith(`${routePath}/`)) {
        return false
      }

      if (!rawQuery) return true
      return hasRequiredQueryParams(rawQuery, currentSearch)
    },
    [currentPath, currentSearch],
  )

  const isExactActive = useCallback(
    (route: string) => {
      const [rawPath, rawQuery] = route.split('?')
      const routePath = normalizePath(rawPath)
      const path = normalizePath(currentPath)
      if (path !== routePath) return false
      if (!rawQuery) return true
      return hasRequiredQueryParams(rawQuery, currentSearch)
    },
    [currentPath, currentSearch],
  )

  const isOnPlaylist = useCallback(
    (id: string) => {
      return currentPath === ROUTES.PLAYLIST.PAGE(id)
    },
    [currentPath],
  )

  return {
    isActive,
    isExactActive,
    isOnPlaylist,
  }
}

function normalizePath(path: string) {
  if (!path || path === '/') return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
}

function hasRequiredQueryParams(requiredQuery: string, currentSearch: string) {
  const required = new URLSearchParams(requiredQuery)
  const current = new URLSearchParams(currentSearch)

  for (const [key, value] of required.entries()) {
    if (current.get(key) !== value) return false
  }

  return true
}
