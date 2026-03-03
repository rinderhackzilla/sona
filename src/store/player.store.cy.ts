import { usePlayerStore } from './player.store'
import { LoopState } from '@/types/playerContext'

describe('player.store critical flows', () => {
  beforeEach(() => {
    cy.fixture('songs/random').then((songs) => {
      usePlayerStore.getState().actions.clearPlayerState()
      usePlayerStore.getState().actions.setSongList(songs, 0)
      usePlayerStore.getState().actions.setPlayingState(true)
    })
  })

  it('continues playback when skipping while paused', () => {
    usePlayerStore.getState().actions.setPlayingState(false)
    usePlayerStore.getState().actions.playNextSong()

    const state = usePlayerStore.getState()
    expect(state.songlist.currentSongIndex).to.equal(1)
    expect(state.playerState.isPlaying).to.equal(true)
  })

  it('loops to first song when loop all is active at queue end', () => {
    const stateBefore = usePlayerStore.getState()
    const lastIndex = stateBefore.songlist.currentList.length - 1

    usePlayerStore.getState().actions.setSongList(stateBefore.songlist.currentList, lastIndex)
    usePlayerStore.setState((state) => {
      state.playerState.loopState = LoopState.All
    })
    usePlayerStore.getState().actions.playNextSong()

    const stateAfter = usePlayerStore.getState()
    expect(stateAfter.songlist.currentSongIndex).to.equal(0)
    expect(stateAfter.playerState.isPlaying).to.equal(true)
  })

  it('switches from queue to lyrics in main drawer without leaving both active', () => {
    const actions = usePlayerStore.getState().actions

    actions.setMainDrawerState(true)
    actions.setQueueState(true)
    actions.setLyricsState(false)
    actions.toggleLyricsAction()

    const state = usePlayerStore.getState()
    expect(state.playerState.mainDrawerState).to.equal(true)
    expect(state.playerState.queueState).to.equal(false)
    expect(state.playerState.lyricsState).to.equal(true)
  })
})
