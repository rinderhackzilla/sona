import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createWithEqualityFn } from 'zustand/traditional'

export enum SonaDjMode {
  Off = 'off',
  Adventure = 'adventure',
  Drift = 'drift',
  Era = 'era',
}

interface ISonaDjStore {
  mode: SonaDjMode
  setMode: (mode: SonaDjMode) => void
}

export const useSonaDjStore = createWithEqualityFn<ISonaDjStore>()(
  persist(
    devtools(
      immer((set) => ({
        mode: SonaDjMode.Off,
        setMode: (mode) => {
          set((state) => {
            state.mode = mode
          })
        },
      })),
      {
        name: 'sona_dj_store',
      },
    ),
    {
      name: 'sona_dj_store',
      partialize: (state) => ({
        mode: state.mode,
      }),
    },
  ),
)

export const useSonaDj = () =>
  useSonaDjStore((state) => ({
    mode: state.mode,
    setMode: state.setMode,
  }))

export const getSonaDjMode = () => useSonaDjStore.getState().mode
