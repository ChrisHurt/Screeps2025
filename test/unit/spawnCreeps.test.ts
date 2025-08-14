import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnCreeps } from '../../src/spawnCreeps'
import { CreepRole, RoomHarvestTask, RoomUpgradeTask, SharedCreepState } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('spawnCreeps', () => {
  let spawnCreepSpy: sinon.SinonSpy
  let mockSpawn: any
  let calculateHarvesterProductionStub: sinon.SinonStub
  let pathFinderStub: sinon.SinonStub

  before(() => {
    spawnCreepSpy = sinon.spy()
    mockSpawn = {
      id: 'Spawn1',
      spawning: null,
      spawnCreep: spawnCreepSpy
    }
    calculateHarvesterProductionStub = sinon.stub(require('../../src/helpers/calculateHarvesterProduction'), 'calculateHarvesterProduction').returns(10)
    // @ts-ignore
    pathFinderStub = sinon.stub().returns({ path: [], ops: 0, cost: 0, incomplete: false })
    // @ts-ignore
    global.PathFinder = { search: pathFinderStub }
  })

  after(() => {
    calculateHarvesterProductionStub.restore()
    // @ts-ignore
    pathFinderStub.reset && pathFinderStub.reset()
  })

  beforeEach(() => {
    setupGlobals()
    // @ts-ignore
    global.Game.spawns = { 'Spawn1': mockSpawn }
    spawnCreepSpy.resetHistory()
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return mockSpawn
      }
    }
  })


    it('should spawn a harvester creep when all conditions are met', () => {
      Game.rooms['W1N1'] = {
        name: 'W1N1',
        find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
        energyAvailable: 300,
        controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
      } as unknown as Room
      Memory.rooms['W1N1'] = {
        tasks: {
          harvest: [
            {
              availablePositions: [{ x: 2, y: 2 }],
              requiredWorkParts: 1,
              roomName: 'W1N1',
              sourceId: 'src1',
              sourcePosition: new RoomPosition(2, 2, 'W1N1'),
              reservingCreeps: {}
            }
          ]
        },
        effectiveEnergyPerTick: 0,
        totalSourceEnergyPerTick: 10
      } as RoomMemory
      Memory.reservations.tasks = {}
      spawnCreeps()
      expect(spawnCreepSpy.called).to.be.true
      const args = spawnCreepSpy.getCall(0).args
      expect(args[0]).to.deep.equal(['work', 'carry', 'move'])
      expect(args[2].memory.role).to.equal(CreepRole.HARVESTER)
      expect(args[2].memory.state).to.equal(SharedCreepState.idle)
    })

    it('should spawn an upgrader creep when all conditions are met', () => {
      Game.rooms['W1N1'] = {
        name: 'W1N1',
        find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
        energyAvailable: 300,
        controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
      } as unknown as Room
      Memory.rooms['W1N1'] = {
        tasks: {
          harvest: [],
          upgrade: {
            availablePositions: [new RoomPosition(1, 1, 'W1N1')],
            controllerId: 'ctrl1',
            controllerPosition: new RoomPosition(1, 1, 'W1N1'),
            reservingCreeps: {},
            roomName: 'W1N1'
          }
        },
        effectiveEnergyPerTick: 0,
        totalSourceEnergyPerTick: 10
      } as RoomMemory
      Memory.reservations.tasks = {}
      spawnCreeps()
      expect(spawnCreepSpy.called).to.be.true
      const args = spawnCreepSpy.getCall(0).args
      expect(args[0]).to.deep.equal(['work', 'carry', 'move'])
      expect(args[2].memory.role).to.equal(CreepRole.UPGRADER)
      expect(args[2].memory.state).to.equal(SharedCreepState.idle)
    })

    it('should not spawn if reserved creeps >= available positions', () => {
      Game.rooms['W1N1'] = {
        name: 'W1N1',
        find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
        energyAvailable: 300,
        controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
      } as unknown as Room
      Memory.rooms['W1N1'] = {
        tasks: {
          harvest: [
            {
              availablePositions: [{ x: 2, y: 2 }],
              requiredWorkParts: 1,
              roomName: 'W1N1',
              sourceId: 'src1',
              sourcePosition: new RoomPosition(2, 2, 'W1N1'),
              reservingCreeps: {}
            }
          ]
        },
        effectiveEnergyPerTick: 0,
        totalSourceEnergyPerTick: 10
      } as RoomMemory
      Memory.reservations.tasks = {
        'Harvester-src1-12345': {
          type: 'harvest',
          sourceId: 'src1',
          sourcePosition: new RoomPosition(2, 2, 'W1N1'),
          workParts: 1,
          returnPath: [],
          taskId: 'W1N1-src1'
        },
        'Upgrader-ctrl1-12345': {
          type: 'upgrade',
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          workParts: 1,
          taskId: 'W1N1-ctrl1'
        }
      }
      spawnCreeps()
      expect(spawnCreepSpy.notCalled).to.be.true
    })

    it('should spawn upgrader if there\'s enough energy generation', () => {
      Game.rooms['W1N1'] = {
        name: 'W1N1',
        find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
        energyAvailable: 300,
        controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
      } as unknown as Room
      Memory.rooms['W1N1'] = {
        tasks: {
          harvest: [
            {
              availablePositions: [],
              requiredWorkParts: 0,
              roomName: 'W1N1',
              sourceId: 'src1',
              sourcePosition: new RoomPosition(2, 2, 'W1N1'),
              reservingCreeps: {}
            }
          ],
          upgrade: {
            availablePositions: [],
            roomName: 'W1N1',
            controllerId: 'ctrl1',
            controllerPosition: new RoomPosition(1, 1, 'W1N1'),
            reservingCreeps: {}
          }
        },
        effectiveEnergyPerTick: 5,
        totalSourceEnergyPerTick: 10
      } as RoomMemory
      Memory.reservations.tasks = {
        'Harvester-src1-12345': {
          type: 'harvest',
          sourceId: 'src1',
          sourcePosition: new RoomPosition(2, 2, 'W1N1'),
          workParts: 1,
          returnPath: [],
          taskId: 'W1N1-src1'
        },
        'Upgrader-ctrl1-12345': {
          type: 'upgrade',
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          workParts: 1,
          taskId: 'W1N1-ctrl1'
        }
      }
      spawnCreeps()
      expect(spawnCreepSpy.args[0][0]).to.be.deep.equal(['work', 'carry', 'move'])
      expect(spawnCreepSpy.args[0][1]).to.equal("Upgrader-ctrl1-12345")
      expect(spawnCreepSpy.args[0][2]).to.deep.equal({
        memory: {
          "idleStarted": 12345,
            "role": "upgrader",
            "state": "idle",
            "task": {
              "controllerId": "ctrl1",
              "controllerPosition": {
                "roomName": "W1N1",
                "x": 1,
                "y": 1
              },
              "taskId": "W1N1-ctrl1",
              "type": "upgrade",
              "workParts": 1
            }
          }
      })
    })

    it('should not spawn upgrader if there\'s not enough energy generation', () => {
      Game.rooms['W1N1'] = {
        name: 'W1N1',
        find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
        energyAvailable: 300,
        controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
      } as unknown as Room
      Memory.rooms['W1N1'] = {
        tasks: {
          harvest: [
            {
              availablePositions: [],
              requiredWorkParts: 0,
              roomName: 'W1N1',
              sourceId: 'src1',
              sourcePosition: new RoomPosition(2, 2, 'W1N1'),
              reservingCreeps: {}
            }
          ],
          upgrade: {
            availablePositions: [],
            roomName: 'W1N1',
            controllerId: 'ctrl1',
            controllerPosition: new RoomPosition(1, 1, 'W1N1'),
            reservingCreeps: {}
          }
        },
        effectiveEnergyPerTick: 0,
        totalSourceEnergyPerTick: 10
      } as RoomMemory
      Memory.reservations.tasks = {
        'Harvester-src1-12345': {
          type: 'harvest',
          sourceId: 'src1',
          sourcePosition: new RoomPosition(2, 2, 'W1N1'),
          workParts: 1,
          returnPath: [],
          taskId: 'W1N1-src1'
        },
        'Upgrader-ctrl1-12345': {
          type: 'upgrade',
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          workParts: 1,
          taskId: 'W1N1-ctrl1'
        }
      }
      spawnCreeps()
      expect(spawnCreepSpy.notCalled).to.be.true
    })

    it('should not spawn if energy is below threshold', () => {
      Game.rooms['W1N1'] = {
        name: 'W1N1',
        find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
        energyAvailable: 100,
        controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
      } as unknown as Room
      Memory.rooms['W1N1'] = {
        tasks: {
          harvest: [
            {
              availablePositions: [{ x: 2, y: 2 }],
              requiredWorkParts: 1,
              roomName: 'W1N1',
              sourceId: 'src1',
              sourcePosition: new RoomPosition(2, 2, 'W1N1'),
              reservingCreeps: {}
            }
          ]
        },
        effectiveEnergyPerTick: 0,
        totalSourceEnergyPerTick: 10
      } as RoomMemory
      Memory.reservations.tasks = {}
      spawnCreeps()
      expect(spawnCreepSpy.notCalled).to.be.true
    })

    it('should not spawn if no available positions for harvest', () => {
      Game.rooms['W1N1'] = {
        name: 'W1N1',
        find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
        energyAvailable: 300,
        controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
      } as unknown as Room
      Memory.rooms['W1N1'] = {
        tasks: {
          harvest: [
            {
              availablePositions: [],
              requiredWorkParts: 1,
              roomName: 'W1N1',
              sourceId: 'src1',
              sourcePosition: new RoomPosition(2, 2, 'W1N1'),
              reservingCreeps: {}
            }
          ]
        },
        effectiveEnergyPerTick: 0,
        totalSourceEnergyPerTick: 10
      } as RoomMemory
      Memory.reservations.tasks = {}
      spawnCreeps()
      expect(spawnCreepSpy.notCalled).to.be.true
    })

  it('should not throw if no rooms', () => {
    Game.rooms = {}
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no spawns', () => {
    Game.rooms = {
      'W1N1': {
        name: 'W1N1',
        find: () => [],
        tasks: {
          harvest: [],
        }
      } as unknown as Room
    }
    Memory.rooms['W1N1'] = { tasks: { } } as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no room is undefined', () => {
    // @ts-expect-error Deliberately malformed for testing
    Game.rooms = { 'W1N1': undefined, find: () => [mockSpawn] } as Room
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no memory for room', () => {
    Game.rooms['W1N1'] = { name: 'W1N1', find: () => [mockSpawn] } as unknown as Room
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no tasks for room', () => {
    Game.rooms['W1N1'] = { name: 'W1N1', find: () => [mockSpawn] } as unknown as Room
    Memory.rooms['W1N1'] = {} as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no harvest tasks', () => {
      Game.rooms['W1N1'] = { name: 'W1N1', find: () => [mockSpawn] } as unknown as Room
      Memory.rooms['W1N1'] = { tasks: { } } as RoomMemory
      expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not spawn creeps for upgrades if no spawn is available', () => {
    Game.creeps = {
      'OldHarvester': { name: 'OldHarvester', workParts: 2 } as Creep,
    }
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return null
      }
    }
    Game.rooms['W1N1'] = {
      name: 'W1N1',
      controller: {
        id: 'ctrl1',
        pos: new RoomPosition(5, 5, 'W1N1'),
      } as StructureController,
      find: () => [mockSpawn]
    } as unknown as Room
    Game.time = 12345
    Memory.rooms['W1N1'] = {
      tasks: {
        harvest: [
          {
            availablePositions: [{ x: 6, y: 6 }],
            reservingCreeps: {
              'Harvester-src1-12345': { workParts: 5 }
            },
            requiredWorkParts: 5,
            roomName: 'W1N1',
            sourceId: 'src1',
            sourcePosition: new RoomPosition(5, 5, 'W1N1'),
            totalSourceEnergyPerTick: 10
          } as RoomHarvestTask
        ],
        upgrade: {
          availablePositions: [new RoomPosition(6, 6, 'W1N1')],
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(5, 5, 'W1N1'),
          reservingCreeps: {},
          roomName: 'W1N1'
        }
      }
    } as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
    expect((Memory.rooms['W1N1'].tasks?.upgrade?.reservingCreeps)).to.deep.equal({})
    expect(spawnCreepSpy.notCalled).to.be.true
  })

  it('should not spawn creeps for harvesting if no spawn is available', () => {
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return null
      }
    }
    Game.creeps = {
      'OldHarvester': { name: 'OldHarvester', workParts: 2 } as Creep,
    }
    Game.rooms['W1N1'] = { name: 'W1N1', find: () => [mockSpawn] } as unknown as Room
    Game.spawns = {}
    Game.time = 12345
    Memory.rooms['W1N1'] = {
      tasks: {
        harvest: [
          {
            availablePositions: [{ x: 6, y: 6 }],
            reservingCreeps: {},
            requiredWorkParts: 5,
            roomName: 'W1N1',
            sourceId: 'src1',
            sourcePosition: new RoomPosition(5, 5, 'W1N1'),
            totalSourceEnergyPerTick: 10
          } as RoomHarvestTask
          ]
      }
    } as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
    expect((Memory.rooms['W1N1'].tasks?.harvest[0].reservingCreeps)).to.deep.equal({})
    expect(spawnCreepSpy.notCalled).to.be.true
  })

  it('should not throw and not spawn if no controller is defined', () => {
    Game.rooms['W7N7'] = { name: 'W7N7', find: (arg: number) => {
      if (arg === FIND_MY_SPAWNS) {
        return [mockSpawn]
      }
      return []
    }} as unknown as Room // No controller property
    Memory.rooms['W7N7'] = { tasks: { harvest: [
      {
        availablePositions: [],
        reservingCreeps: {},
        requiredWorkParts: 0,
        roomName: 'W4N4',
        sourceId: 'srcZ',
        sourcePosition: new RoomPosition(3, 3, 'W4N4'),
        totalSourceEnergyPerTick: 5
      } as RoomHarvestTask],
      upgrade: {
        availablePositions: [new RoomPosition(1, 1, 'W7N7')],
        controllerId: 'ctrlX',
        controllerPosition: new RoomPosition(1, 1, 'W7N7'),
        reservingCreeps: {},
        roomName: 'W7N7'
      } as RoomUpgradeTask
    } } as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
    expect(spawnCreepSpy.notCalled).to.be.true
    expect(Memory.rooms['W7N7'].tasks?.upgrade?.reservingCreeps).to.deep.equal({})
  })
})