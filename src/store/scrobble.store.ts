import { create } from 'zustand'

export type ScrobbleStatus =
  | 'idle'
  | 'sending-now'
  | 'now-ok'
  | 'now-failed'
  | 'sending'
  | 'ok'
  | 'failed'

interface IScrobbleStatusStore {
  status: ScrobbleStatus
  trackId: string | null
  updatedAt: number
  hasPendingScrobbleFailure: boolean
  lastScrobbleFailedAt: number
  lastScrobbleSucceededAt: number
  setStatus: (status: ScrobbleStatus, trackId?: string | null) => void
}

export const useScrobbleStatusStore = create<IScrobbleStatusStore>((set) => ({
  status: 'idle',
  trackId: null,
  updatedAt: 0,
  hasPendingScrobbleFailure: false,
  lastScrobbleFailedAt: 0,
  lastScrobbleSucceededAt: 0,
  setStatus: (status, trackId = null) =>
    set((state) => {
      const now = Date.now()
      const next: Partial<IScrobbleStatusStore> = {
        status,
        trackId,
        updatedAt: now,
      }

      if (status === 'failed') {
        next.hasPendingScrobbleFailure = true
        next.lastScrobbleFailedAt = now
      }

      if (status === 'ok') {
        next.hasPendingScrobbleFailure = false
        next.lastScrobbleSucceededAt = now
      }

      return { ...state, ...next }
    }),
}))

export const useScrobbleStatus = () =>
  useScrobbleStatusStore((state) => ({
    status: state.status,
    trackId: state.trackId,
    updatedAt: state.updatedAt,
    hasPendingScrobbleFailure: state.hasPendingScrobbleFailure,
    lastScrobbleFailedAt: state.lastScrobbleFailedAt,
    lastScrobbleSucceededAt: state.lastScrobbleSucceededAt,
  }))
