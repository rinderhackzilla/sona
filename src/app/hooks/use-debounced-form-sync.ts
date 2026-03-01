import { useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import type { FieldValues, UseFormWatch } from 'react-hook-form'

export function useDebouncedFormSync<TFieldValues extends FieldValues>(
  watch: UseFormWatch<TFieldValues>,
  onChange: (data: Partial<TFieldValues>) => void,
  delayMs = 500,
) {
  const debounced = useDebouncedCallback(onChange, delayMs)

  useEffect(() => {
    const subscription = watch((data) => {
      debounced(data as Partial<TFieldValues>)
    })

    return () => {
      subscription.unsubscribe()
      debounced.cancel()
    }
  }, [debounced, watch])
}
