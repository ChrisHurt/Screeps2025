import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { initialiseMemory } from '../../src/initialiseMemory'
import { mockGame } from '../helpers/mock'

describe('initialiseMemory', () => {
  beforeEach(() => {
    // @ts-ignore
    global.Game = { ...mockGame }
    // @ts-ignore
    global.Memory = {}
  })

  it('should initialise all expected memory properties', () => {
    initialiseMemory()
    expect(Memory.creeps).to.deep.equal({})
    expect(Memory.mapConnections).to.be.an('array')
    expect(Memory.mapRoomGraph).to.be.an('object')
    expect(Memory.memoryInitialised).to.equal(true)
    expect(Memory.powerCreeps).to.deep.equal({})
    expect(Memory.rooms).to.deep.equal({})
  })
})
