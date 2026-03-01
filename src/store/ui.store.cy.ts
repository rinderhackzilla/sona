import { useUiStore } from './ui.store'

describe('ui.store flows', () => {
  beforeEach(() => {
    useUiStore.setState((state) => {
      state.miniPlayer.open = false
      state.miniPlayer.pinned = false
      state.fullscreen.open = false
    })
  })

  it('toggles mini player and preserves pin state controls', () => {
    useUiStore.getState().miniPlayer.toggleOpen()
    expect(useUiStore.getState().miniPlayer.open).to.equal(true)

    useUiStore.getState().miniPlayer.setPinned(true)
    expect(useUiStore.getState().miniPlayer.pinned).to.equal(true)

    useUiStore.getState().miniPlayer.togglePinned()
    expect(useUiStore.getState().miniPlayer.pinned).to.equal(false)
  })

  it('opens and closes fullscreen state explicitly', () => {
    useUiStore.getState().fullscreen.setOpen(true)
    expect(useUiStore.getState().fullscreen.open).to.equal(true)

    useUiStore.getState().fullscreen.setOpen(false)
    expect(useUiStore.getState().fullscreen.open).to.equal(false)
  })
})
