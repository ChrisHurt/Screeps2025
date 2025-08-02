import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnCreeps } from '../../src/spawnCreeps'
import { mockGame, mockMemory } from './mock'
import { RoomHarvestTask } from 'types'

describe('spawnCreeps', () => {
  let spawnCreepSpy: sinon.SinonSpy

  beforeEach(() => {
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
    spawnCreepSpy = sinon.spy()
    // Setup a mock spawn structure with the spy
    const mockSpawn = {
      id: 'Spawn1',
      spawning: null,
      spawnCreep: spawnCreepSpy
    }
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

  it('should not spawn creeps if no spawn is available', () => {
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
          'harvesterB': { workParts: 2 }
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
})