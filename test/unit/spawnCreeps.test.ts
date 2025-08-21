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
          build: [],
          harvest: [
            {
              availablePositions: [new RoomPosition(2, 2, 'W1N1')],
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
          build: [],
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
          build: [],
          harvest: [
            {
              availablePositions: [new RoomPosition(2, 2, 'W1N1')],
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
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          workParts: 1,
          returnPath: [],
          taskId: 'W1N1-ctrl1',
          type: 'upgrade',
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
          build: [],
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
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          workParts: 1,
          returnPath: [],
          taskId: 'W1N1-ctrl1',
          type: 'upgrade',
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
            returnPath: [],
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
          build: [],
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
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          returnPath: [],
          taskId: 'W1N1-ctrl1',
          type: 'upgrade',
          workParts: 1,
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
          build: [],
          harvest: [
            {
              availablePositions: [new RoomPosition(2, 2, 'W1N1')],
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
          build: [],
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
          build: [],
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

  it('should not throw if no harvest or build tasks', () => {
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
        build: [],
        harvest: [
          {
            availablePositions: [new RoomPosition(6, 6, 'W1N1')],
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
    } as unknown as RoomMemory
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
        build: [],
        harvest: [
          {
            availablePositions: [new RoomPosition(6, 6, 'W1N1')],
            reservingCreeps: {},
            requiredWorkParts: 5,
            roomName: 'W1N1',
            sourceId: 'src1',
            sourcePosition: new RoomPosition(5, 5, 'W1N1'),
            totalSourceEnergyPerTick: 10
          } as RoomHarvestTask
          ]
      }
    } as unknown as RoomMemory
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
    Memory.rooms['W7N7'] = { tasks: {
      build: [],
      harvest: [
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
    } } as unknown as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
    expect(spawnCreepSpy.notCalled).to.be.true
    expect(Memory.rooms['W7N7'].tasks?.upgrade?.reservingCreeps).to.deep.equal({})
  })
  it('should spawn a guard creep when enemyCreepCount > guardCount and enough energy', () => {
    Game.rooms['W2N2'] = {
      name: 'W2N2',
      find: (type: number, opts?: any) => {
        if (type === FIND_MY_SPAWNS) return [mockSpawn]
        if (type === FIND_MY_CREEPS) return []
        return []
      },
      energyAvailable: 150,
      controller: { id: 'ctrl2', pos: new RoomPosition(1, 1, 'W2N2') }
    } as unknown as Room
    Memory.rooms['W2N2'] = {
      tasks: {
        build: [],
        harvest: [],
      },
      threats: {
        enemyCreepCount: 2,
        enemyPowerCreepCount: 0,
        enemyStructures: [],
        lastObserved: Game.time || 0
      },
      effectiveEnergyPerTick: 0,
      totalSourceEnergyPerTick: 0
    } as RoomMemory
    Memory.reservations.tasks = {}
    Memory.production = { energy: {} }
    spawnCreeps()
    expect(spawnCreepSpy.called).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[0]).to.deep.equal([TOUGH, ATTACK, MOVE])
    expect(args[2].memory.role).to.equal(CreepRole.GUARD)
    expect(args[2].memory.state).to.equal(SharedCreepState.idle)
  })

  it('should not spawn guard creep if not enough energy', () => {
    Game.rooms['W2N2'] = {
      name: 'W2N2',
      find: (type: number, opts?: any) => {
        if (type === FIND_MY_SPAWNS) return [mockSpawn]
        if (type === FIND_MY_CREEPS) return []
        return []
      },
      energyAvailable: 100,
      controller: { id: 'ctrl2', pos: new RoomPosition(1, 1, 'W2N2') }
    } as unknown as Room
    Memory.rooms['W2N2'] = {
      tasks: {
        build: [],
        harvest: [],
      },
      threats: {
        enemyCreepCount: 2,
        enemyPowerCreepCount: 0,
        enemyStructures: [],
        lastObserved: Game.time || 0
      },
      effectiveEnergyPerTick: 0,
      totalSourceEnergyPerTick: 0
    } as RoomMemory
    Memory.reservations.tasks = {}
    Memory.production = { energy: {} }
    spawnCreeps()
    expect(spawnCreepSpy.notCalled).to.be.true
  })

  it('should not spawn guard creep if enemyCreepCount <= guardCount', () => {
    Game.rooms['W2N2'] = {
      name: 'W2N2',
      find: (type: number, opts?: any) => {
        if (type === FIND_MY_SPAWNS) return [mockSpawn]
        if (type === FIND_MY_CREEPS) return [{ memory: { role: CreepRole.GUARD } }]
        return []
      },
      energyAvailable: 150,
      controller: { id: 'ctrl2', pos: new RoomPosition(1, 1, 'W2N2') }
    } as unknown as Room
    Memory.rooms['W2N2'] = {
      tasks: {
        build: [],
        harvest: [],
      },
      threats: {
        enemyCreepCount: 1,
        enemyPowerCreepCount: 0,
        enemyStructures: [],
        lastObserved: Game.time || 0
      },
      effectiveEnergyPerTick: 0,
      totalSourceEnergyPerTick: 0
    } as RoomMemory
    Memory.reservations.tasks = {}
    Memory.production = { energy: {} }
    spawnCreeps()
    expect(spawnCreepSpy.notCalled).to.be.true
  })

    it('should fully cover guardCount filter logic and spawning behavior', () => {
      // Case 1: No guards, should spawn
      Game.rooms['W4N4'] = {
        name: 'W4N4',
        find: (type: number, opts?: any) => {
          if (type === FIND_MY_SPAWNS) return [mockSpawn]
          if (type === FIND_MY_CREEPS) return []
          return []
        },
        energyAvailable: 200,
        controller: { id: 'ctrl4', pos: new RoomPosition(1, 1, 'W4N4') }
      } as unknown as Room
      Memory.rooms['W4N4'] = {
        tasks: { build: [], harvest: [] },
        threats: { enemyCreepCount: 2, enemyPowerCreepCount: 0, enemyStructures: [], lastObserved: Game.time || 0 },
        effectiveEnergyPerTick: 0,
        totalSourceEnergyPerTick: 0
      } as RoomMemory
      Memory.reservations.tasks = {}
      Memory.production = { energy: {} }
      spawnCreeps()
      expect(spawnCreepSpy.called).to.be.true
      const args = spawnCreepSpy.getCall(0).args
      expect(args[0]).to.deep.equal([TOUGH, ATTACK, MOVE])
      expect(args[2].memory.role).to.equal(CreepRole.GUARD)
      spawnCreepSpy.resetHistory()

      // Case 2: One guard, enemyCreepCount == guardCount, should NOT spawn
      Game.rooms['W4N4'] = {
        name: 'W4N4',
        find: (type: number, opts?: any) => {
          if (type === FIND_MY_SPAWNS) return [mockSpawn]
          if (type === FIND_MY_CREEPS) return [{ memory: { role: CreepRole.GUARD } }]
          return []
        },
        energyAvailable: 200,
        controller: { id: 'ctrl4', pos: new RoomPosition(1, 1, 'W4N4') }
      } as unknown as Room
      if (Memory.rooms['W4N4'] && Memory.rooms['W4N4'].threats) {
        Memory.rooms['W4N4'].threats.enemyCreepCount = 1
      }
      spawnCreeps()
      expect(spawnCreepSpy.notCalled).to.be.true
      spawnCreepSpy.resetHistory()

      // Case 3: Multiple guards, enemyCreepCount < guardCount, should NOT spawn
      Game.rooms['W4N4'] = {
        name: 'W4N4',
        find: (type: number, opts?: any) => {
          if (type === FIND_MY_SPAWNS) return [mockSpawn]
          if (type === FIND_MY_CREEPS) return [
            { memory: { role: CreepRole.GUARD } },
            { memory: { role: CreepRole.GUARD } }
          ]
          return []
        },
        energyAvailable: 200,
        controller: { id: 'ctrl4', pos: new RoomPosition(1, 1, 'W4N4') }
      } as unknown as Room
      if (Memory.rooms['W4N4'] && Memory.rooms['W4N4'].threats) {
        Memory.rooms['W4N4'].threats.enemyCreepCount = 1
      }
      spawnCreeps()
      expect(spawnCreepSpy.notCalled).to.be.true
      spawnCreepSpy.resetHistory()

      // Case 4: Guards with other roles, only GUARDs should be counted
      Game.rooms['W4N4'] = {
        name: 'W4N4',
        find: (type: number, opts?: any) => {
          if (type === FIND_MY_SPAWNS) return [mockSpawn]
          if (type === FIND_MY_CREEPS) return [
            { memory: { role: CreepRole.GUARD } },
            { memory: { role: CreepRole.HARVESTER } },
            { memory: { role: CreepRole.UPGRADER } }
          ]
          return []
        },
        energyAvailable: 200,
        controller: { id: 'ctrl4', pos: new RoomPosition(1, 1, 'W4N4') }
      } as unknown as Room
      if (Memory.rooms['W4N4'] && Memory.rooms['W4N4'].threats) {
        Memory.rooms['W4N4'].threats.enemyCreepCount = 1
      }
      spawnCreeps()
      expect(spawnCreepSpy.notCalled).to.be.true
      spawnCreepSpy.resetHistory()
    })

  it('should spawn a builder creep when build tasks exist', () => {
    Game.rooms['W1N1'] = {
      name: 'W1N1',
      find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
      energyAvailable: 300,
      controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
    } as unknown as Room
    Memory.rooms['W1N1'] = {
      tasks: {
        build: [{
          buildParams: {
            position: new RoomPosition(3, 3, 'W1N1'),
            repairDuringSiege: false,
            path: [new RoomPosition(2, 2, 'W1N1')]
          },
          roomName: 'W1N1'
        }],
        harvest: [],
        upgrade: {
          availablePositions: [new RoomPosition(1, 1, 'W1N1')],
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          reservingCreeps: {},
          roomName: 'W1N1'
        }
      },
      effectiveEnergyPerTick: 3,
      totalSourceEnergyPerTick: 10
    } as unknown as RoomMemory
    Memory.reservations.tasks = {}
    Game.creeps = {}
    spawnCreeps()
    expect(spawnCreepSpy.called).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[0]).to.deep.equal(['work', 'carry', 'carry', 'move', 'move'])
    expect(args[2].memory.role).to.equal(CreepRole.BUILDER)
    expect(args[2].memory.state).to.equal(SharedCreepState.idle)
    expect(args[2].memory.task.type).to.equal('build')
  })

  it('should not spawn builder if energy is insufficient for build tasks', () => {
    Game.rooms['W1N1'] = {
      name: 'W1N1',
      find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
      energyAvailable: 299, // Less than 300 required for builder
      controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
    } as unknown as Room
    Memory.rooms['W1N1'] = {
      tasks: {
        build: [{
          buildParams: {
            position: new RoomPosition(3, 3, 'W1N1'),
            repairDuringSiege: false,
            path: [new RoomPosition(2, 2, 'W1N1')]
          },
          roomName: 'W1N1'
        }],
        harvest: [],
        upgrade: {
          availablePositions: [new RoomPosition(1, 1, 'W1N1')],
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          reservingCreeps: {},
          roomName: 'W1N1'
        }
      },
      effectiveEnergyPerTick: 3,
      totalSourceEnergyPerTick: 10
    } as unknown as RoomMemory
    Memory.reservations.tasks = {}
    Game.creeps = {}
    spawnCreeps()
    // Only upgrader should be spawned (which needs 200 energy), but not builder (which needs 300)
    expect(spawnCreepSpy.calledOnce).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[2].memory.role).to.equal(CreepRole.UPGRADER)
  })

  it('should not spawn builder if no build tasks exist', () => {
    Game.rooms['W1N1'] = {
      name: 'W1N1',
      find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
      energyAvailable: 300,
      controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
    } as unknown as Room
    Memory.rooms['W1N1'] = {
      tasks: {
        build: [], // No build tasks
        harvest: [],
        upgrade: {
          availablePositions: [new RoomPosition(1, 1, 'W1N1')],
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          reservingCreeps: {},
          roomName: 'W1N1'
        }
      },
      effectiveEnergyPerTick: 3,
      totalSourceEnergyPerTick: 10
    } as unknown as RoomMemory
    Memory.reservations.tasks = {}
    Game.creeps = {}
    spawnCreeps()
    // Only upgrader should be spawned, not builder
    expect(spawnCreepSpy.calledOnce).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[2].memory.role).to.equal(CreepRole.UPGRADER)
  })

  it('should not spawn builder if no spawn is available for build task', () => {
    Game.rooms['W1N1'] = {
      name: 'W1N1',
      find: (type: number) => type === FIND_MY_SPAWNS ? [mockSpawn] : [],
      energyAvailable: 300,
      controller: { id: 'ctrl1', pos: new RoomPosition(1, 1, 'W1N1') }
    } as unknown as Room
    Memory.rooms['W1N1'] = {
      tasks: {
        build: [{
          buildParams: {
            position: new RoomPosition(3, 3, 'W1N1'),
            repairDuringSiege: false,
            path: [new RoomPosition(2, 2, 'W1N1')]
          },
          roomName: 'W1N1'
        }],
        harvest: [],
        upgrade: {
          availablePositions: [new RoomPosition(1, 1, 'W1N1')],
          controllerId: 'ctrl1',
          controllerPosition: new RoomPosition(1, 1, 'W1N1'),
          reservingCreeps: {},
          roomName: 'W1N1'
        }
      },
      effectiveEnergyPerTick: 3,
      totalSourceEnergyPerTick: 10
    } as unknown as RoomMemory
    Memory.reservations.tasks = {}
    Game.creeps = {}

    // Override RoomPosition.findClosestByPath to return null for this test
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return null // No spawn found
      }
    }

    spawnCreeps()
    // Only upgrader should be spawned, not builder
    expect(spawnCreepSpy.calledOnce).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[2].memory.role).to.equal(CreepRole.UPGRADER)

    // Reset RoomPosition for other tests
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return mockSpawn
      }
    }
  })
})