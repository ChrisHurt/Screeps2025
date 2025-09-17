import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnBuilders } from '../../src/spawning/spawnBuilders'
import { CreepRole, SharedCreepState, EnergyImpactType, RoomBuildTask } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('spawnBuilders', () => {
  let spawnCreepSpy: sinon.SinonSpy
  let mockSpawn: any
  let calculateBuilderProductionStub: sinon.SinonStub
  let calculateCreepUpkeepStub: sinon.SinonStub
  let calculateRoomEnergyProductionStub: sinon.SinonStub
  let addConsumerCreepToEnergyLogisticsStub: sinon.SinonStub

  const createBuildTask = (x: number = 3, y: number = 3): RoomBuildTask => ({
    buildParams: {
      position: new RoomPosition(x, y, 'W1N1'),
      repairDuringSiege: false,
      path: [new RoomPosition(x - 1, y - 1, 'W1N1')],
      structureType: STRUCTURE_ROAD
    },
    roomName: 'W1N1',
    reservingCreeps: {}
  })

  beforeEach(() => {
    setupGlobals()
    spawnCreepSpy = sinon.stub().returns(OK) // Default to successful spawn
    mockSpawn = {
      id: 'Spawn1',
      spawning: null,
      spawnCreep: spawnCreepSpy,
      pos: new RoomPosition(10, 10, 'W1N1')
    }
    calculateBuilderProductionStub = sinon.stub(require('../../src/calculateBuilderProduction'), 'calculateBuilderProduction').returns(2)
    calculateCreepUpkeepStub = sinon.stub(require('../../src/helpers/calculateCreepUpkeep'), 'calculateCreepUpkeep').returns(0.1)
    calculateRoomEnergyProductionStub = sinon.stub().returns(5)
    addConsumerCreepToEnergyLogisticsStub = sinon.stub(require('../../src/logistics/addConsumerCreepToEnergyLogistics'), 'addConsumerCreepToEnergyLogistics')

    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return mockSpawn
      }
    }
  })

  afterEach(() => {
    calculateBuilderProductionStub.restore()
    calculateCreepUpkeepStub.restore()
    addConsumerCreepToEnergyLogisticsStub.restore()
  })

  it('should spawn builder when build tasks exist and no builders', () => {
    const buildTasks: RoomBuildTask[] = [createBuildTask()]

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnBuilders({
      builderCount: 0,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[0]).to.deep.equal([WORK, CARRY, CARRY, MOVE, MOVE])
    expect(args[1]).to.equal(`Builder-W1N1-${Game.time}`)
    expect(args[2].memory.role).to.equal(CreepRole.BUILDER)
    expect(args[2].memory.state).to.equal(SharedCreepState.idle)
    expect(result.length).to.equal(0) // spawn should be removed
  })

  it('should not spawn builder when no build tasks exist', () => {
    const buildTasks: RoomBuildTask[] = []

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnBuilders({
      builderCount: 0,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn builder when builderCount >= 2', () => {
    const buildTasks: RoomBuildTask[] = [{
      buildParams: {
        position: new RoomPosition(3, 3, 'W1N1'),
        repairDuringSiege: false,
        path: [new RoomPosition(2, 2, 'W1N1')],
        structureType: STRUCTURE_ROAD
      },
      roomName: 'W1N1',
      reservingCreeps: {}
    }]

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnBuilders({
      builderCount: 2,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn builder when builderCount = 1 and effectiveEnergyPerTick <= 2', () => {
    const buildTasks: RoomBuildTask[] = [createBuildTask()]

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 2 // <= 2
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnBuilders({
      builderCount: 1,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should spawn builder when builderCount = 1 and effectiveEnergyPerTick > 2', () => {
    const buildTasks: RoomBuildTask[] = [{
      buildParams: {
        position: new RoomPosition(3, 3, 'W1N1'),
        repairDuringSiege: false,
        path: [new RoomPosition(2, 2, 'W1N1')],
        structureType: STRUCTURE_ROAD
      },
      reservingCreeps: {},
      roomName: 'W1N1'
    }]

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3 // > 2
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnBuilders({
      builderCount: 1,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    expect(result.length).to.equal(0) // spawn should be removed
  })

  it('should not spawn builder when not enough energy', () => {
    const buildTasks: RoomBuildTask[] = [{
      buildParams: {
        position: new RoomPosition(3, 3, 'W1N1'),
        repairDuringSiege: false,
        path: [new RoomPosition(2, 2, 'W1N1')],
        structureType: STRUCTURE_ROAD
      },
      reservingCreeps: {},
      roomName: 'W1N1'
    }]

    const room = {
      energyAvailable: 299 // Less than 300 required
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnBuilders({
      builderCount: 0,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn builder when no spawn is available', () => {
    const buildTasks: RoomBuildTask[] = [{
      buildParams: {
        position: new RoomPosition(3, 3, 'W1N1'),
        repairDuringSiege: false,
        path: [new RoomPosition(2, 2, 'W1N1')],
        structureType: STRUCTURE_ROAD
      },
      reservingCreeps: {},
      roomName: 'W1N1'
    }]

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3
    } as any

    const spawnsAvailable = [mockSpawn]

    // Override RoomPosition.findClosestByPath to return null
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return null
      }
    }

    const result = spawnBuilders({
      builderCount: 0,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should handle spawn failure gracefully', () => {
    const buildTasks: RoomBuildTask[] = [{
      buildParams: {
        position: new RoomPosition(3, 3, 'W1N1'),
        repairDuringSiege: false,
        path: [new RoomPosition(2, 2, 'W1N1')],
        structureType: STRUCTURE_ROAD
      },
      reservingCreeps: {},
      roomName: 'W1N1'
    }]

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    // Mock spawn to fail with a different error (not ERR_NOT_ENOUGH_ENERGY)
    mockSpawn.spawnCreep = sinon.stub().returns(ERR_BUSY)

    const result = spawnBuilders({
      builderCount: 0,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(mockSpawn.spawnCreep.called).to.be.true
    expect(result.length).to.equal(1) // spawn should remain when spawn fails
  })

  it('should update memory and logistics when spawning builder', () => {
    const buildTasks: RoomBuildTask[] = [{
      buildParams: {
        position: new RoomPosition(3, 3, 'W1N1'),
        repairDuringSiege: false,
        path: [new RoomPosition(2, 2, 'W1N1')],
        structureType: STRUCTURE_ROAD
      },
      reservingCreeps: {},
      roomName: 'W1N1'
    }]

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    spawnBuilders({
      builderCount: 0,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const creepName = spawnCreepSpy.getCall(0).args[1]
    const memoryObject = spawnCreepSpy.getCall(0).args[2].memory
    
    // Check that spawnCreep was called with correct task in memory
    expect(memoryObject.task).to.exist
    expect(memoryObject.task.type).to.equal('build')
    
    // Check that spawnCreep was called with correct energy impact in memory
    expect(memoryObject.energyImpact).to.exist
    expect(memoryObject.energyImpact.perTickAmount).to.equal(-2.1) // -0.1 - 2
    expect(memoryObject.energyImpact.roomNames).to.deep.equal(['W1N1'])
    expect(memoryObject.energyImpact.type).to.equal(EnergyImpactType.CREEP)
    
    // Check that logistics was updated
    expect(addConsumerCreepToEnergyLogisticsStub.called).to.be.true
  })

  it('should handle multiple build tasks', () => {
    const buildTasks: RoomBuildTask[] = [
      {
        buildParams: {
          position: new RoomPosition(3, 3, 'W1N1'),
          repairDuringSiege: false,
          path: [new RoomPosition(2, 2, 'W1N1')],
          structureType: STRUCTURE_ROAD
        },
        reservingCreeps: {},
        roomName: 'W1N1'
      },
      {
        buildParams: {
          position: new RoomPosition(5, 5, 'W1N1'),
          repairDuringSiege: false,
          path: [new RoomPosition(4, 4, 'W1N1')],
          structureType: STRUCTURE_ROAD
        },
        reservingCreeps: {},
        roomName: 'W1N1'
      }
    ]

    const mockSpawn2 = {
      id: 'Spawn2',
      spawning: null,
      spawnCreep: sinon.stub().returns(OK),
      pos: new RoomPosition(11, 11, 'W1N1')
    }

    // Mock findClosestByPath to return different spawns
    let findCallCount = 0
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath(spawns: any[]) {
        // Return the first available spawn in the array
        return spawns[0] || null
      }
    }

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 3
    } as any

    const spawnsAvailable = [mockSpawn, mockSpawn2]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnBuilders({
      builderCount: 0,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    expect(mockSpawn2.spawnCreep.called).to.be.true
    expect(result.length).to.equal(0) // both spawns should be used
  })

  it('should handle case where effectiveEnergyPerTick is undefined', () => {
    const buildTasks: RoomBuildTask[] = [{
      buildParams: {
        position: new RoomPosition(3, 3, 'W1N1'),
        repairDuringSiege: false,
        path: [new RoomPosition(2, 2, 'W1N1')],
        structureType: STRUCTURE_ROAD
      },
      reservingCreeps: {},
      roomName: 'W1N1'
    }]

    const room = {
      energyAvailable: 300
    } as any as Room

    const roomMemory = {
      // effectiveEnergyPerTick is undefined
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnBuilders({
      builderCount: 1,
      buildTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true // Should not spawn when effectiveEnergyPerTick is 0/undefined
    expect(result.length).to.equal(1) // spawn should remain
  })
})
