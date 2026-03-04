import { createWithEqualityFn } from 'zustand/traditional'

export type RadioNowPlayingState = {
  radioId: string | null
  artist: string | null
  track: string | null
  rawTitle: string
  coverUrl: string | null
  sourceUrl: string | null
}

type RadioNowPlayingStore = {
  current: RadioNowPlayingState | null
  setCurrent: (value: RadioNowPlayingState | null) => void
  clear: () => void
}

export const useRadioNowPlayingStore =
  createWithEqualityFn<RadioNowPlayingStore>()((set) => ({
    current: null,
    setCurrent: (value) => set({ current: value }),
    clear: () => set({ current: null }),
  }))

export const useRadioNowPlaying = () =>
  useRadioNowPlayingStore((state) => state.current)
