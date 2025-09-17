import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnHarvesters } from '../../src/spawning/spawnHarvesters'
import { CreepRole, SharedCreepState, EnergyImpactType, RoomHarvestTask } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('spawnHarvesters', () => {
  let spawnCreepStub: sinon.SinonSpy
  let mockSpawn: any
  let calculateHarvesterProductionStub: sinon.SinonStub
  let calculateCreepUpkeepStub: sinon.SinonStub
  let addProducerCreepToEnergyLogisticsStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()
    spawnCreepStub = sinon.stub().returns(OK)
    mockSpawn = {
      id: 'Spawn1',
      spawning: null,
      spawnCreep: spawnCreepStub,
      pos: new RoomPosition(10, 10, 'W1N1')
    }
    calculateHarvesterProductionStub = sinon.stub(require('../../src/helpers/calculateHarvesterProduction'), 'calculateHarvesterProduction').returns({
      productionPerTick: 10,
      returnPath: []
    })
    calculateCreepUpkeepStub = sinon.stub(require('../../src/helpers/calculateCreepUpkeep'), 'calculateCreepUpkeep').returns(0.1)
    addProducerCreepToEnergyLogisticsStub = sinon.stub(require('../../src/logistics/addProducerCreepToEnergyLogistics'), 'addProducerCreepToEnergyLogistics')

    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return mockSpawn
      }
    }
  })

  afterEach(() => {
    calculateHarvesterProductionStub.restore()
    calculateCreepUpkeepStub.restore()
    addProducerCreepToEnergyLogisticsStub.restore()
  })

  it('should spawn harvester when workers are needed and room is available', () => {
    const harvestTasks: RoomHarvestTask[] = [{
      availablePositions: [new RoomPosition(2, 2, 'W1N1')],
      requiredWorkParts: 2,
      roomName: 'W1N1',
      sourceId: 'src1',
      sourcePosition: new RoomPosition(2, 2, 'W1N1'),
      reservingCreeps: {}
    }]

    const room = {
      energyAvailable: 300,
      find: () => [mockSpawn]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepStub.called).to.be.true
    const args = spawnCreepStub.getCall(0).args
    expect(args[0]).to.deep.equal([WORK, WORK, CARRY, MOVE])
    expect(args[1]).to.equal(`Harvester-src1-${Game.time}`)
    expect(args[2].memory.role).to.equal(CreepRole.HARVESTER)
    expect(args[2].memory.state).to.equal(SharedCreepState.idle)
    expect(result.harvestTasksNeedCreeps).to.be.false
    expect(result.spawnsAvailable.length).to.equal(0) // spawn should be removed
  })

  it('should not spawn harvester when not enough energy', () => {
    const harvestTasks: RoomHarvestTask[] = [{
      availablePositions: [new RoomPosition(2, 2, 'W1N1')],
      requiredWorkParts: 2,
      roomName: 'W1N1',
      sourceId: 'src1',
      sourcePosition: new RoomPosition(2, 2, 'W1N1'),
      reservingCreeps: {}
    }]

    const room = {
      energyAvailable: 299, // Less than 300 required
      find: () => [mockSpawn]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepStub.notCalled).to.be.true
    expect(result.harvestTasksNeedCreeps).to.be.true
    expect(result.spawnsAvailable.length).to.equal(1) // spawn should remain
  })

  it('should not spawn harvester when no workers are needed', () => {
    const harvestTasks: RoomHarvestTask[] = [{
      availablePositions: [new RoomPosition(2, 2, 'W1N1')],
      requiredWorkParts: 2,
      roomName: 'W1N1',
      sourceId: 'src1',
      sourcePosition: new RoomPosition(2, 2, 'W1N1'),
      reservingCreeps: {}
    }]

    const room = {
      energyAvailable: 300,
      find: () => [mockSpawn]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { 
      energy: {},
      tasks: {
        'Harvester-src1-12345': {
          type: 'harvest',
          sourceId: 'src1',
          sourcePosition: new RoomPosition(2, 2, 'W1N1'),
          workParts: 2,
          returnPath: [],
          taskId: 'W1N1-src1'
        } as any
      }
    }
    

    const result = spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepStub.notCalled).to.be.true
    expect(result.harvestTasksNeedCreeps).to.be.false
    expect(result.spawnsAvailable.length).to.equal(1) // spawn should remain
  })

  it('should not spawn harvester when no room is available', () => {
    const harvestTasks: RoomHarvestTask[] = [{
      availablePositions: [], // No available positions
      requiredWorkParts: 2,
      roomName: 'W1N1',
      sourceId: 'src1',
      sourcePosition: new RoomPosition(2, 2, 'W1N1'),
      reservingCreeps: {}
    }]

    const room = {
      energyAvailable: 300,
      find: () => [mockSpawn]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepStub.notCalled).to.be.true
    expect(result.harvestTasksNeedCreeps).to.be.false
    expect(result.spawnsAvailable.length).to.equal(1) // spawn should remain
  })

  it('should not spawn harvester when no spawn is available', () => {
    const harvestTasks: RoomHarvestTask[] = [{
      availablePositions: [new RoomPosition(2, 2, 'W1N1')],
      requiredWorkParts: 2,
      roomName: 'W1N1',
      sourceId: 'src1',
      sourcePosition: new RoomPosition(2, 2, 'W1N1'),
      reservingCreeps: {}
    }]

    const room = {
      energyAvailable: 300,
      find: () => [mockSpawn]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    // Override RoomPosition.findClosestByPath to return null
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return null
      }
    }

    const result = spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepStub.notCalled).to.be.true
    expect(result.harvestTasksNeedCreeps).to.be.false
    expect(result.spawnsAvailable.length).to.equal(1) // spawn should remain
  })

  it('should handle spawn failure gracefully', () => {
    const harvestTasks: RoomHarvestTask[] = [{
      availablePositions: [new RoomPosition(2, 2, 'W1N1')],
      requiredWorkParts: 2,
      roomName: 'W1N1',
      sourceId: 'src1',
      sourcePosition: new RoomPosition(2, 2, 'W1N1'),
      reservingCreeps: {}
    }]

    const room = {
      energyAvailable: 300,
      find: () => [mockSpawn]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    // Mock spawn to fail
    mockSpawn.spawnCreep = sinon.stub().returns(ERR_NOT_ENOUGH_ENERGY)

    const result = spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(mockSpawn.spawnCreep.called).to.be.true
    expect(result.harvestTasksNeedCreeps).to.be.true
    expect(result.spawnsAvailable.length).to.equal(0) // spawn should be removed even on failure
  })

  it('should update memory and logistics when spawning harvester', () => {
    const harvestTasks: RoomHarvestTask[] = [{
      availablePositions: [new RoomPosition(2, 2, 'W1N1')],
      requiredWorkParts: 2,
      roomName: 'W1N1',
      sourceId: 'src1',
      sourcePosition: new RoomPosition(2, 2, 'W1N1'),
      reservingCreeps: {}
    }]

    const room = {
      energyAvailable: 300,
      find: () => [mockSpawn]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepStub.called).to.be.true
    const creepName = spawnCreepStub.getCall(0).args[1]
    const memoryObject = spawnCreepStub.getCall(0).args[2].memory

    // Check that spawnCreep was called with correct task in memory
    expect(memoryObject.task).to.exist
    expect(memoryObject.task.type).to.equal('harvest')
    expect(memoryObject.task.sourceId).to.equal('src1')

    // Check that spawnCreep was called with correct energy impact in memory
    expect(memoryObject.energyImpact).to.exist
    expect(memoryObject.energyImpact.perTickAmount).to.equal(9.9) // 10 - 0.1
    expect(memoryObject.energyImpact.roomNames).to.deep.equal(['W1N1'])
    expect(memoryObject.energyImpact.type).to.equal(EnergyImpactType.CREEP)

    // Check that logistics was updated
    expect(addProducerCreepToEnergyLogisticsStub.called).to.be.true
  })

  it('should handle multiple harvest tasks', () => {
    const harvestTasks: RoomHarvestTask[] = [
      {
        availablePositions: [new RoomPosition(2, 2, 'W1N1')],
        requiredWorkParts: 2,
        roomName: 'W1N1',
        sourceId: 'src1',
        sourcePosition: new RoomPosition(2, 2, 'W1N1'),
        reservingCreeps: {}
      },
      {
        availablePositions: [new RoomPosition(4, 4, 'W1N1')],
        requiredWorkParts: 2,
        roomName: 'W1N1',
        sourceId: 'src2',
        sourcePosition: new RoomPosition(4, 4, 'W1N1'),
        reservingCreeps: {}
      }
    ]

    const mockSpawn2 = {
      id: 'Spawn2',
      spawning: null,
      spawnCreep: sinon.spy(),
      pos: new RoomPosition(11, 11, 'W1N1')
    }

    const room = {
      energyAvailable: 300,
      find: () => [mockSpawn, mockSpawn2]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn, mockSpawn2]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepStub.calledTwice).to.be.true
  })

  it('should return empty array when no harvest tasks', () => {
    const harvestTasks: RoomHarvestTask[] = []

    const room = {
      energyAvailable: 300,
      find: () => [mockSpawn]
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnHarvesters({
      harvestTasks,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepStub.notCalled).to.be.true
    expect(result.harvestTasksNeedCreeps).to.be.false
    expect(result.spawnsAvailable.length).to.equal(1) // spawn should remain
  })
})
