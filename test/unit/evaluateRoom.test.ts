import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { evaluateRoom } from '../../src/evaluateRoom'
import { setupGlobals } from '../helpers/setupGlobals'

describe('evaluateRoom', () => {
  beforeEach(() => {
    setupGlobals()
  })

  it('should not throw if room is not in Game.rooms', () => {
    expect(() => evaluateRoom('W1N1')).to.not.throw()
  })

  it('should not throw if room is present', () => {
    Game.rooms['W1N1'] = { name: 'W1N1' } as Room
    expect(() => evaluateRoom('W1N1')).to.not.throw()
  })

  // Add more tests as the implementation of evaluateRoom grows
})
