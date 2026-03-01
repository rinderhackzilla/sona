import { SessionModeObserver } from './session-mode-observer'
import { usePlayerStore } from '@/store/player.store'

describe('SessionModeObserver', () => {
  beforeEach(() => {
    usePlayerStore.getState().settings.sessionMode.setMode('off')
    cy.mount(<SessionModeObserver />)
  })

  it('applies focus class to root', () => {
    usePlayerStore.getState().settings.sessionMode.setMode('focus')
    cy.document().its('documentElement').should(($root) => {
      expect($root.hasClass('session-mode-focus')).to.equal(true)
      expect($root.hasClass('session-mode-night')).to.equal(false)
    })
  })

  it('applies night class to root', () => {
    usePlayerStore.getState().settings.sessionMode.setMode('night')
    cy.document().its('documentElement').should(($root) => {
      expect($root.hasClass('session-mode-night')).to.equal(true)
      expect($root.hasClass('session-mode-focus')).to.equal(false)
    })
  })
})
