import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnHaulers } from '../../src/spawning/spawnHaulers'
import { CreepRole, SharedCreepState, EnergyImpactType } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('spawnHaulers', () => {
  let spawnCreepSpy: sinon.SinonSpy
  let mockSpawn: any
  let calculateCreepUpkeepStub: sinon.SinonStub
  let calculateRoomEnergyProductionStub: sinon.SinonStub
  let addCarrierCreepToEnergyLogisticsStub: sinon.SinonStub

  const baseEnergyLogistics = () => ({
    carriers: {},
    consumers: {},
    hauling: {},
    linkGroups: {},
    producers: {},
    roomStates: {},
    stores: {},
    terminals: {}
  })

  beforeEach(() => {
    setupGlobals()
    spawnCreepSpy = sinon.stub().returns(OK)
    mockSpawn = {
      id: 'Spawn1',
      spawning: null,
      spawnCreep: spawnCreepSpy,
      pos: new RoomPosition(10, 10, 'W1N1')
    }
    calculateCreepUpkeepStub = sinon.stub(require('../../src/helpers/calculateCreepUpkeep'), 'calculateCreepUpkeep').returns(0.1)
    addCarrierCreepToEnergyLogisticsStub = sinon.stub(require('../../src/logistics/addCarrierToEnergyLogistics'), 'addCarrierCreepToEnergyLogistics')
  })

  afterEach(() => {
    calculateCreepUpkeepStub.restore()
    addCarrierCreepToEnergyLogisticsStub.restore()
  })

  it('should spawn hauler when haulerCount is 0', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = { 
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 50, supply: 50, net: 0 } }
    }
    

    const result = spawnHaulers({
      haulerCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[0]).to.deep.equal([MOVE, CARRY]) // Small body for net <= 100
    expect(args[1]).to.equal(`Hauler-W1N1-${Game.time}`)
    expect(args[2].memory.role).to.equal(CreepRole.HAULER)
    expect(args[2].memory.state).to.equal(SharedCreepState.idle)
    expect(result.length).to.equal(0) // spawn should be removed
  })

  it('should spawn large hauler when haulingData.net > 100', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = { 
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 200, supply: 50, net: 150 } }
    } // net > 100
    

    const result = spawnHaulers({
      haulerCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[0]).to.deep.equal([MOVE, CARRY, MOVE, CARRY]) // Large body for net > 100
    expect(result.length).to.equal(0) // spawn should be removed
  })

  it('should spawn hauler when haulerCount > 0 and haulingData.net > 50', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = { 
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 150, supply: 50, net: 100 } }
    } // net > 50
    

    const result = spawnHaulers({
      haulerCount: 1, // Already has haulers
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    expect(result.length).to.equal(0) // spawn should be removed
  })

  it('should not spawn hauler when haulerCount > 0 and haulingData.net <= 50', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = { 
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 50, supply: 50, net: 0 } }
    } // net <= 50
    

    const result = spawnHaulers({
      haulerCount: 1, // Already has haulers
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn hauler when not enough energy for small hauler', () => {
    const room = {
      energyAvailable: 99 // Less than 100 needed for small hauler
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = { 
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 50, supply: 50, net: 0 } }
    }
    

    const result = spawnHaulers({
      haulerCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn large hauler when energy is insufficient', () => {
    const room = {
      energyAvailable: 200 // Less than 300 needed for large hauler but enough for small
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = { 
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 200, supply: 50, net: 150 } }
    } // net > 100 (would want large)
    

    const result = spawnHaulers({
      haulerCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true // Should not spawn because it wants large but can't afford it
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should spawn hauler when haulingData is undefined and haulerCount is 0', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = baseEnergyLogistics() // No hauling data for W1N1
    

    const result = spawnHaulers({
      haulerCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[0]).to.deep.equal([MOVE, CARRY]) // Default small body
    expect(result.length).to.equal(0) // spawn should be removed
  })

  it('should not spawn hauler when haulingData is undefined and haulerCount > 0', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = baseEnergyLogistics() // No hauling data for W1N1
    

    const result = spawnHaulers({
      haulerCount: 1, // Already has haulers
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn hauler when no spawns are available', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable: StructureSpawn[] = [] // No spawns available

    Memory.energyLogistics = { 
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 50, supply: 50, net: 0 } }
    }
    

    const result = spawnHaulers({
      haulerCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(0)
  })

  it('should update memory and logistics when spawning hauler', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = {
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 50, supply: 50, net: 0 } }
    }
    

    spawnHaulers({
      haulerCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const creepName = spawnCreepSpy.getCall(0).args[1]
    const memoryObject = spawnCreepSpy.getCall(0).args[2].memory

    // Check that spawnCreep was called with correct energy impact in memory
    expect(memoryObject.energyImpact).to.exist
    expect(memoryObject.energyImpact.perTickAmount).to.be.lessThan(0) // Should be negative (upkeep)
    expect(memoryObject.energyImpact.roomNames).to.deep.equal(['W1N1'])
    expect(memoryObject.energyImpact.type).to.equal(EnergyImpactType.CREEP)

    // Check that logistics was updated
    expect(addCarrierCreepToEnergyLogisticsStub.called).to.be.true
  })

  it('should handle spawn failure gracefully', () => {
    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.energyLogistics = { 
      ...baseEnergyLogistics(),
      hauling: { W1N1: { demand: 50, supply: 50, net: 0 } }
    }
    

    // Mock spawn to fail
    mockSpawn.spawnCreep = sinon.stub().returns(ERR_NOT_ENOUGH_ENERGY)

    const result = spawnHaulers({
      haulerCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(mockSpawn.spawnCreep.called).to.be.true
    expect(result.length).to.equal(0) // spawn should still be removed
  })
})
