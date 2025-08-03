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
    expect(Memory.initialCalculationsDone).to.equal(false)
    expect(Memory.flags).to.deep.equal({})
    expect(Memory.mapConnections).to.deep.equal([])
    expect(Memory.mapRoomGraph).to.deep.equal({})
    expect(Memory.memoryInitialised).to.equal(true)
    expect(Memory.powerCreeps).to.deep.equal({})
    expect(Memory.rooms).to.deep.equal({})
    expect(Memory.spawns).to.deep.equal({})
    expect(Memory.queues).to.have.property('evaluations')
    expect(Memory.queues).to.have.property('structures')
    expect(Memory.queues).to.have.property('creeps')
  })
})
