import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnCreeps } from '../../src/spawnCreeps'
import { CreepRole, RoomHarvestTask, RoomUpgradeTask, SharedCreepState } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'
import { calculateHarvesterProduction } from '../../src/helpers/calculateHarvesterProduction'


describe('spawnCreeps', () => {
  let spawnCreepSpy: sinon.SinonSpy = sinon.spy()
  const mockSpawn = {
    id: 'Spawn1',
    spawning: null,
    spawnCreep: spawnCreepSpy
  }
  let calculateHarvesterProductionStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()
    // @ts-ignore
    global.Game.spawns = { 'Spawn1': mockSpawn }
    calculateHarvesterProductionStub = sinon.stub(require('../../src/helpers/calculateHarvesterProduction'), 'calculateHarvesterProduction').returns(10)

    spawnCreepSpy.resetHistory()
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByPath() {
        return mockSpawn
      }
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should not throw if no rooms', () => {
    Game.rooms = {}
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no spawns', () => {
    Game.rooms = {
      'W1N1': {
        name: 'W1N1',
        find: () => {
          return []
        },
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