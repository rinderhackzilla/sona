interface ISongInfo {
  songId: string
  setSongId: (id: string) => void
  modalOpen: boolean
  setModalOpen: (open: boolean) => void
  reset: () => void
}

interface IMiniPlayerUi {
  open: boolean
  pinned: boolean
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setPinned: (pinned: boolean) => void
  togglePinned: () => void
}

interface IFullscreenUi {
  open: boolean
  setOpen: (open: boolean) => void
}

export interface IUiContext {
  songInfo: ISongInfo
  miniPlayer: IMiniPlayerUi
  fullscreen: IFullscreenUi
}
