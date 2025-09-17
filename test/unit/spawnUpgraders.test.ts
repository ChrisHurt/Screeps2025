import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnUpgraders } from '../../src/spawning/spawnUpgraders'
import { CreepRole, SharedCreepState, EnergyImpactType, RoomUpgradeTask } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('spawnUpgraders', () => {
  let spawnCreepSpy: sinon.SinonSpy
  let mockSpawn: any
  let calculateUpgraderProductionStub: sinon.SinonStub
  let calculateCreepUpkeepStub: sinon.SinonStub
  let addConsumerCreepToEnergyLogisticsStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()
    spawnCreepSpy = sinon.stub().returns(OK)
    mockSpawn = {
      id: 'Spawn1',
      spawning: null,
      spawnCreep: spawnCreepSpy,
      pos: new RoomPosition(10, 10, 'W1N1')
    }
    calculateUpgraderProductionStub = sinon.stub(require('../../src/calculateUpgraderProduction'), 'calculateUpgraderProduction').returns({
      productionPerTick: 5,
      returnPath: []
    })
    calculateCreepUpkeepStub = sinon.stub(require('../../src/helpers/calculateCreepUpkeep'), 'calculateCreepUpkeep').returns(0.1)
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
    calculateUpgraderProductionStub.restore()
    calculateCreepUpkeepStub.restore()
    addConsumerCreepToEnergyLogisticsStub.restore()
  })

  it('should spawn upgrader when conditions are met', () => {
    const upgradeTask: RoomUpgradeTask = {
      availablePositions: [new RoomPosition(1, 1, 'W1N1')],
      controllerId: 'ctrl1',
      controllerPosition: new RoomPosition(1, 1, 'W1N1'),
      reservingCreeps: {},
      roomName: 'W1N1'
    }

    const room = {
      controller: {
        id: 'ctrl1',
        pos: {
          findClosestByPath: () => mockSpawn
        }
      }
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnUpgraders({
      effectiveEnergyPerTick: 5,
      upgradeTask,
      upgraderCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[0]).to.deep.equal([WORK, CARRY, MOVE])
    expect(args[1]).to.equal(`Upgrader-ctrl1-${Game.time}`)
    expect(args[2].memory.role).to.equal(CreepRole.UPGRADER)
    expect(args[2].memory.state).to.equal(SharedCreepState.idle)
    expect(result.length).to.equal(0) // spawn should be removed
  })

  it('should not spawn upgrader when no upgrade task', () => {
    const room = {
      controller: {
        id: 'ctrl1',
        pos: {
          findClosestByPath: () => mockSpawn
        }
      }
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnUpgraders({
      effectiveEnergyPerTick: 5,
      upgradeTask: null as any,
      upgraderCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn upgrader when no controller', () => {
    const upgradeTask: RoomUpgradeTask = {
      availablePositions: [new RoomPosition(1, 1, 'W1N1')],
      controllerId: 'ctrl1',
      controllerPosition: new RoomPosition(1, 1, 'W1N1'),
      reservingCreeps: {},
      roomName: 'W1N1'
    }

    const room = {
      controller: null
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnUpgraders({
      effectiveEnergyPerTick: 5,
      upgradeTask,
      upgraderCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn upgrader when no spawn available', () => {
    const upgradeTask: RoomUpgradeTask = {
      availablePositions: [new RoomPosition(1, 1, 'W1N1')],
      controllerId: 'ctrl1',
      controllerPosition: new RoomPosition(1, 1, 'W1N1'),
      reservingCreeps: {},
      roomName: 'W1N1'
    }

    const room = {
      controller: {
        id: 'ctrl1',
        pos: {
          findClosestByPath: () => null // No spawn found
        }
      }
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnUpgraders({
      effectiveEnergyPerTick: 5,
      upgradeTask,
      upgraderCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should not spawn upgrader when should not spawn condition is false', () => {
    const upgradeTask: RoomUpgradeTask = {
      availablePositions: [new RoomPosition(1, 1, 'W1N1')],
      controllerId: 'ctrl1',
      controllerPosition: new RoomPosition(1, 1, 'W1N1'),
      reservingCreeps: {},
      roomName: 'W1N1'
    }

    const room = {
      controller: {
        id: 'ctrl1',
        pos: {
          findClosestByPath: () => mockSpawn
        }
      }
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { 
      energy: {},
      tasks: {
        'Upgrader-ctrl1-12345': {
          type: 'upgrade',
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          workParts: 15, // This will make shouldSpawnUpgrader false
          returnPath: [],
          taskId: 'W1N1-ctrl1'
        } as any
      }
    }

    const result = spawnUpgraders({
      effectiveEnergyPerTick: 2, // Low energy
      upgradeTask,
      upgraderCount: 5, // Max upgraders
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })

  it('should handle spawn failure gracefully', () => {
    const upgradeTask: RoomUpgradeTask = {
      availablePositions: [new RoomPosition(1, 1, 'W1N1')],
      controllerId: 'ctrl1',
      controllerPosition: new RoomPosition(1, 1, 'W1N1'),
      reservingCreeps: {},
      roomName: 'W1N1'
    }

    const room = {
      controller: {
        id: 'ctrl1',
        pos: {
          findClosestByPath: () => mockSpawn
        }
      }
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    // Mock spawn to fail
    mockSpawn.spawnCreep = sinon.stub().returns(ERR_NOT_ENOUGH_ENERGY)

    const result = spawnUpgraders({
      effectiveEnergyPerTick: 5,
      upgradeTask,
      upgraderCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(mockSpawn.spawnCreep.called).to.be.true
    expect(result.length).to.equal(0) // spawn should still be removed
  })

  it('should update memory and logistics when spawning upgrader', () => {
    const upgradeTask: RoomUpgradeTask = {
      availablePositions: [new RoomPosition(1, 1, 'W1N1')],
      controllerId: 'ctrl1',
      controllerPosition: new RoomPosition(1, 1, 'W1N1'),
      reservingCreeps: {},
      roomName: 'W1N1'
    }

    const room = {
      controller: {
        id: 'ctrl1',
        pos: {
          findClosestByPath: () => mockSpawn
        }
      }
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    spawnUpgraders({
      effectiveEnergyPerTick: 5,
      upgradeTask,
      upgraderCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const spawnCall = spawnCreepSpy.getCall(0)
    const creepMemory = spawnCall.args[2].memory
    
    // Check that task is stored in creep memory passed to spawnCreep
    expect(creepMemory.task).to.exist
    expect(creepMemory.task.type).to.equal('upgrade')
    expect(creepMemory.task.controllerId).to.equal('ctrl1')
    
    // Check that energy impact was stored in creep memory passed to spawnCreep
    expect(creepMemory.energyImpact).to.exist
    expect(creepMemory.energyImpact.perTickAmount).to.equal(-5.1) // -0.1 - 5
    expect(creepMemory.energyImpact.roomNames).to.deep.equal(['W1N1'])
    expect(creepMemory.energyImpact.type).to.equal(EnergyImpactType.CREEP)

    // Check that logistics was updated
    expect(addConsumerCreepToEnergyLogisticsStub.called).to.be.true
  })

  it('should spawn multiple upgraders when conditions allow', () => {
    const upgradeTask: RoomUpgradeTask = {
      availablePositions: [new RoomPosition(1, 1, 'W1N1')],
      controllerId: 'ctrl1',
      controllerPosition: new RoomPosition(1, 1, 'W1N1'),
      reservingCreeps: {},
      roomName: 'W1N1'
    }

    const room = {
      controller: {
        id: 'ctrl1',
        pos: {
          findClosestByPath: () => mockSpawn
        }
      }
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    Memory.reservations = { energy: {}, tasks: {} }
    

    const result = spawnUpgraders({
      effectiveEnergyPerTick: 5, // High energy
      upgradeTask,
      upgraderCount: 2, // Less than 5
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    expect(result.length).to.equal(0) // spawn should be removed
  })

  it('should not spawn when upgrade task is missing controller info', () => {
    const upgradeTask = {
      availablePositions: [new RoomPosition(1, 1, 'W1N1')],
      controllerId: null,
      controllerPosition: null,
      reservingCreeps: {},
      roomName: 'W1N1'
    } as any

    const room = {
      controller: {
        id: 'ctrl1',
        pos: {
          findClosestByPath: () => mockSpawn
        }
      }
    } as any as Room

    const roomMemory = {
      effectiveEnergyPerTick: 0
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnUpgraders({
      effectiveEnergyPerTick: 5,
      upgradeTask,
      upgraderCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain
  })
})
