import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnCreeps } from '../../src/spawnCreeps'
import { mockGame, mockMemory } from './mock'
import { RoomHarvestTask, RoomUpgradeTask } from 'types'

describe('spawnCreeps', () => {
  let spawnCreepSpy: sinon.SinonSpy = sinon.spy()
  const mockSpawn = {
    id: 'Spawn1',
    spawning: null,
    spawnCreep: spawnCreepSpy
  }

  beforeEach(() => {
    spawnCreepSpy.resetHistory()
    // @ts-ignore
    global.Game = { ...mockGame }
    // @ts-ignore
    global.Memory = { ...mockMemory }
    // @ts-ignore
    global.FIND_MY_SPAWNS = 3
    // @ts-ignore
    global.WORK = 'work'
    // @ts-ignore
    global.CARRY = 'carry'
    // @ts-ignore
    global.MOVE = 'move'
    // @ts-ignore
    global.Game.spawns = { 'Spawn1': mockSpawn }
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByRange() {
        return mockSpawn
      }
    }

    global.Game.rooms = {}
    global.Game.creeps = {}
  })

  it('should not throw if no rooms', () => {
    Game.rooms = {}
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no room is undefined', () => {
    // @ts-expect-error Deliberately malformed for testing
    Game.rooms = { 'W1N1': undefined } as Room
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no memory for room', () => {
    Game.rooms['W1N1'] = { name: 'W1N1' } as Room
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no tasks for room', () => {
    Game.rooms['W1N1'] = { name: 'W1N1' } as Room
    Memory.rooms['W1N1'] = {} as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not throw if no harvest tasks', () => {
    Game.rooms['W1N1'] = { name: 'W1N1' } as Room
    Memory.rooms['W1N1'] = { tasks: { } } as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
  })

  it('should not modify reservingCreeps if no creeps are alive', () => {
    Game.rooms['W6N6'] = { name: 'W6N6' } as Room
    Memory.rooms['W6N6'] = { tasks: { harvest: [
      {
        availablePositions: [{ x: 6, y: 6 }],
        reservingCreeps: {
          'deadCreep': { workParts: 1 }
        },
        requiredWorkParts: 1,
        roomName: 'W6N6',
        sourceId: 'srcV',
        sourcePosition: new RoomPosition(6, 6, 'W6N6'),
        totalEnergyGenerationPerTick: 5
      } as RoomHarvestTask
    ] } } as RoomMemory
    spawnCreeps()
    expect(Memory.rooms['W6N6'].tasks?.harvest[0].reservingCreeps).to.deep.equal({})
  })

  it('should reserve upgrade task for newly spawning creeps in room and on creep', () => {
    Game.creeps = {
      'OldHarvester': { name: 'OldHarvester', workParts: 2 } as Creep,
    }
    Game.rooms['W1N1'] = {
      name: 'W1N1',
      controller: {
        id: 'ctrl1',
        pos: new RoomPosition(5, 5, 'W1N1'),
      } as StructureController
    } as Room
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
            totalEnergyGenerationPerTick: 10
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
    expect((Memory.rooms['W1N1'].tasks?.upgrade?.reservingCreeps)).to.deep.equal({
      'Upgrader-ctrl1-12345': { workParts: 1 },
    })
    expect(spawnCreepSpy.getCalls()[0].args[0]).to.be.eql([WORK, CARRY, MOVE])
    expect(spawnCreepSpy.getCalls()[0].args[1]).to.equal('Upgrader-ctrl1-12345')
    expect(spawnCreepSpy.getCalls()[0].args[2].memory.task).to.contain({
      controllerId: 'ctrl1',
      // NOTE: The RoomPosition constructor cooperates poorly with the spy
      // controllerPosition: new RoomPosition(5, 5, 'W1N1'),
      type: 'upgrade',
      taskId: 'W1N1-ctrl1',
      workParts: 1
    })
  })

  it('should not spawn creeps for upgrades if no spawn is available', () => {
    Game.creeps = {
      'OldHarvester': { name: 'OldHarvester', workParts: 2 } as Creep,
    }
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByRange() {
        return null
      }
    }
    Game.rooms['W1N1'] = {
      name: 'W1N1',
      controller: {
        id: 'ctrl1',
        pos: new RoomPosition(5, 5, 'W1N1'),
      } as StructureController
    } as Room
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
            totalEnergyGenerationPerTick: 10
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

  it('should reserve harvest tasks for newly spawning creeps in room and on creep', () => {
    Game.creeps = {
      'OldHarvester': { name: 'OldHarvester', workParts: 2 } as Creep,
    }
    Game.rooms['W1N1'] = { name: 'W1N1' } as Room
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
            totalEnergyGenerationPerTick: 10
          } as RoomHarvestTask
          ]
      }
    } as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
    expect((Memory.rooms['W1N1'].tasks?.harvest[0].reservingCreeps)).to.deep.equal({
      'Harvester-src1-12345': { workParts: 1 },
    })

    expect(spawnCreepSpy.calledWith(
      [WORK, CARRY, MOVE],
      'Harvester-src1-12345',
      { memory: {
        task: {
          sourceId: 'src1',
          sourcePosition: new RoomPosition(5, 5, 'W1N1'),
          type: 'harvest',
          taskId: 'W1N1-src1',
          workParts: 1
        }
      }}
    )).to.be.true
  })

  it('should not spawn creeps for harvesting if no spawn is available', () => {
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByRange() {
        return null
      }
    }
    Game.creeps = {
      'OldHarvester': { name: 'OldHarvester', workParts: 2 } as Creep,
    }
    Game.rooms['W1N1'] = { name: 'W1N1' } as Room
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
            totalEnergyGenerationPerTick: 10
          } as RoomHarvestTask
          ]
      }
    } as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
    expect((Memory.rooms['W1N1'].tasks?.harvest[0].reservingCreeps)).to.deep.equal({})
    expect(spawnCreepSpy.notCalled).to.be.true
  })

  it('should not add creeps to reservingCreeps if not in Game.creeps', () => {
    Game.creeps = {}
    Game.rooms['W3N3'] = { name: 'W3N3' } as Room
    Memory.rooms['W3N3'] = { tasks: { harvest: [
      {
        availablePositions: [{ x: 2, y: 2 }],
        reservingCreeps: { 'ghostCreep': { workParts: 2 } },
        requiredWorkParts: 2,
        roomName: 'W3N3',
        sourceId: 'srcY',
        sourcePosition: new RoomPosition(2, 2, 'W3N3'),
        totalEnergyGenerationPerTick: 5
      } as RoomHarvestTask
    ] } } as RoomMemory
    spawnCreeps()
    expect(Memory.rooms['W3N3'].tasks?.harvest[0].reservingCreeps).to.deep.equal({})
  })

  it('should preserve reservingCreeps for multiple living creeps', () => {
    Game.creeps = {
      'harvesterA': { name: 'harvesterA', workParts: 1 } as Creep,
      'harvesterB': { name: 'harvesterB', workParts: 2 } as Creep,
    }
    Game.rooms['W4N4'] = { name: 'W4N4' } as Room
    Memory.rooms['W4N4'] = { tasks: { harvest: [
      {
        availablePositions: [{ x: 3, y: 3 }, { x: 4, y: 4 }],
        reservingCreeps: {
          'harvesterA': { workParts: 1 },
          'harvesterB': { workParts: 2 },
          'harvesterC': { workParts: 3 } // This creep is no longer alive
        },
        requiredWorkParts: 3,
        roomName: 'W4N4',
        sourceId: 'srcZ',
        sourcePosition: new RoomPosition(3, 3, 'W4N4'),
        totalEnergyGenerationPerTick: 5
      } as RoomHarvestTask
    ] } } as RoomMemory
    spawnCreeps()
    expect(Memory.rooms['W4N4'].tasks?.harvest[0].reservingCreeps).to.deep.equal({
      'harvesterA': { workParts: 1 },
      'harvesterB': { workParts: 2 }
    })
  })

  it('should not throw and not spawn if no controller is defined', () => {
    Game.rooms['W7N7'] = { name: 'W7N7' } as Room // No controller property
    Memory.rooms['W7N7'] = { tasks: { harvest: [
      {
        availablePositions: [{ x: 3, y: 3 }, { x: 4, y: 4 }],
        reservingCreeps: {
          'harvesterA': { workParts: 1 },
          'harvesterB': { workParts: 2 },
          'harvesterC': { workParts: 3 } // This creep is no longer alive
        },
        requiredWorkParts: 3,
        roomName: 'W4N4',
        sourceId: 'srcZ',
        sourcePosition: new RoomPosition(3, 3, 'W4N4'),
        totalEnergyGenerationPerTick: 5
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