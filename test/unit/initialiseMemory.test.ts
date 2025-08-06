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
    expect(Memory.flags).to.deep.equal({})
    expect(Memory.mapConnections).to.be.an('array')
    expect(Memory.mapRoomGraph).to.be.an('object')
    expect(Memory.memoryInitialised).to.equal(true)
    expect(Memory.powerCreeps).to.deep.equal({})
    expect(Memory.rooms).to.deep.equal({})
    expect(Memory.spawns).to.deep.equal({})
    expect(Memory.queues).to.have.property('evaluations')
    expect(Memory.queues.evaluations).to.have.property('rankedQueue')
    expect(Memory.queues.structures).to.have.property('rankedQueue')
    expect(Memory.queues.creeps).to.have.property('rankedQueue')
    // Add checks for any new properties if present
    if (Memory.queues.evaluations.rankedQueue) {
      expect(Memory.queues.evaluations.rankedQueue).to.be.an('array')
    }
    if (Memory.queues.structures.rankedQueue) {
      expect(Memory.queues.structures.rankedQueue).to.be.an('array')
    }
    if (Memory.queues.creeps.rankedQueue) {
      expect(Memory.queues.creeps.rankedQueue).to.be.an('array')
    }
  })
})
