export function safeStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // no-op
  }
}

export function safeStorageRemove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // no-op
  }
}

export function safeStorageGetBoolean(key: string, fallback: boolean): boolean {
  const raw = safeStorageGet(key)
  if (raw === null) return fallback
  return raw === 'true'
}
