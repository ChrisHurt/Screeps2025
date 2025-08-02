import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { renderMapConnections } from '../../src/renderMapConnections'
import { mockGame, mockMemory } from './mock'

describe('renderMapConnections', () => {
  beforeEach(() => {
    // @ts-ignore
    global.Game = { ...mockGame }
    // @ts-ignore
    global.Memory = { ...mockMemory }
    // @ts-ignore
    global.RoomPosition = function(x, y, roomName) {
      return { x, y, roomName }
    }
    // @ts-ignore
    global.Game.map.visual = { line: function() { (Game.map.visual.calls = Game.map.visual.calls || []).push([...arguments]) } }
    // @ts-ignore
    global.Memory.mapConnections = undefined
  })

  it('should not throw if there are no connections', () => {
    Memory.mapConnections = []
    expect(() => renderMapConnections()).to.not.throw()
    // @ts-ignore Mock for Game.map.visual
    expect(Game.map.visual.calls || []).to.have.length(0)
  })

  it('should not throw if connections are undefined', () => {
    // Memory.mapConnections = []
    expect(() => renderMapConnections()).to.not.throw()
    // @ts-ignore Mock for Game.map.visual
    expect(Game.map.visual.calls || []).to.have.length(0)
  })

  it('should call Game.map.visual.line for each connection', () => {
    Memory.mapConnections = ['W1N1-W2N2', 'W2N2-W3N3']
    renderMapConnections()
    // @ts-ignore Mock for Game.map.visual
    expect(Game.map.visual.calls).to.have.length(2)
    // Check that the correct room names are used
    // @ts-ignore Mock for Game.map.visual
    expect(Game.map.visual.calls[0][0].roomName).to.equal('W1N1')
    // @ts-ignore Mock for Game.map.visual
    expect(Game.map.visual.calls[0][1].roomName).to.equal('W2N2')
    // @ts-ignore Mock for Game.map.visual
    expect(Game.map.visual.calls[1][0].roomName).to.equal('W2N2')
    // @ts-ignore Mock for Game.map.visual
    expect(Game.map.visual.calls[1][1].roomName).to.equal('W3N3')
  })
})
