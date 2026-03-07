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
  setStatus: (status: ScrobbleStatus, trackId?: string | null) => void
}

export const useScrobbleStatusStore = create<IScrobbleStatusStore>((set) => ({
  status: 'idle',
  trackId: null,
  updatedAt: 0,
  setStatus: (status, trackId = null) =>
    set({
      status,
      trackId,
      updatedAt: Date.now(),
    }),
}))

export const useScrobbleStatus = () =>
  useScrobbleStatusStore((state) => ({
    status: state.status,
    trackId: state.trackId,
    updatedAt: state.updatedAt,
  }))

