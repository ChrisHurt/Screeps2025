import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { spawnCreeps } from '../../src/spawnCreeps'
import { mockGame, mockMemory } from './mock'
import { HarvestTask } from 'types'

describe('spawnCreeps', () => {
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
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
      findClosestByRange() { return null }
    }
  })

  it('should not throw if no rooms', () => {
    Game.rooms = {}
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
    Memory.rooms['W1N1'] = { tasks: { harvest: [] as HarvestTask[] } } as RoomMemory
    expect(() => spawnCreeps()).to.not.throw()
  })
})
