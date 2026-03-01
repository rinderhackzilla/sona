import { startTransition } from 'react'
import type { NavigateFunction, NavigateOptions, To } from 'react-router-dom'

type NavigateTarget = To | number

export function navigateSafe(
  navigate: NavigateFunction,
  target: NavigateTarget,
  options?: NavigateOptions,
) {
  startTransition(() => {
    if (typeof target === 'number') {
      navigate(target)
      return
    }

    navigate(target, options)
  })
}
