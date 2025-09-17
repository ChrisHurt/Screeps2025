import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnGuards } from '../../src/spawning/spawnGuards'
import { CreepRole, SharedCreepState, EnergyImpactType } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('spawnGuards', () => {
  let spawnCreepSpy: sinon.SinonSpy
  let mockSpawn: any
  let calculateCreepUpkeepStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()
    spawnCreepSpy = sinon.spy()
    mockSpawn = {
      id: 'Spawn1',
      spawning: null,
      spawnCreep: spawnCreepSpy
    }
    calculateCreepUpkeepStub = sinon.stub(require('../../src/helpers/calculateCreepUpkeep'), 'calculateCreepUpkeep').returns(0.1)
  })

  afterEach(() => {
    calculateCreepUpkeepStub.restore()
  })

  it('should spawn a guard when enemyCreepCount > guardCount and enough energy', () => {
    const room = {
      energyAvailable: 150
    } as Room

    const roomMemory = {
      threats: {
        enemyCreepCount: 2,
        enemyPowerCreepCount: 0,
        enemyStructures: [],
        lastObserved: Game.time || 0
      }
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnGuards({
      guardCount: 1,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.called).to.be.true
    const args = spawnCreepSpy.getCall(0).args
    expect(args[0]).to.deep.equal([TOUGH, ATTACK, MOVE])
    expect(args[1]).to.equal(`Guard-${mockSpawn.id}-${Game.time}`)
    expect(args[2].memory.role).to.equal(CreepRole.GUARD)
    expect(args[2].memory.state).to.equal(SharedCreepState.idle)
    expect(result.length).to.equal(0) // spawn should be removed from available spawns
  })

  it('should not spawn guard when enemyCreepCount <= guardCount', () => {
    const room = {
      energyAvailable: 150
    } as Room

    const roomMemory = {
      threats: {
        enemyCreepCount: 1,
        enemyPowerCreepCount: 0,
        enemyStructures: [],
        lastObserved: Game.time || 0
      }
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnGuards({
      guardCount: 1,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain in available spawns
  })

  it('should not spawn guard when not enough energy', () => {
    const room = {
      energyAvailable: 139 // Less than 140 required
    } as Room

    const roomMemory = {
      threats: {
        enemyCreepCount: 2,
        enemyPowerCreepCount: 0,
        enemyStructures: [],
        lastObserved: Game.time || 0
      }
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnGuards({
      guardCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain in available spawns
  })

  it('should not spawn guard when no threats exist', () => {
    const room = {
      energyAvailable: 150
    } as Room

    const roomMemory = {} as any // No threats property

    const spawnsAvailable = [mockSpawn]

    const result = spawnGuards({
      guardCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(1) // spawn should remain in available spawns
  })

  it('should handle spawn failure gracefully', () => {
    // Mock spawn to return failure
    mockSpawn.spawnCreep = sinon.stub().returns(ERR_NOT_ENOUGH_ENERGY)

    const room = {
      energyAvailable: 150
    } as Room

    const roomMemory = {
      threats: {
        enemyCreepCount: 2,
        enemyPowerCreepCount: 0,
        enemyStructures: [],
        lastObserved: Game.time || 0
      }
    } as any

    const spawnsAvailable = [mockSpawn]

    const result = spawnGuards({
      guardCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(mockSpawn.spawnCreep.called).to.be.true
    expect(result.length).to.equal(0) // spawn should still be removed even on failure
  })


  it('should not spawn guard when spawnsAvailable is empty', () => {
    const room = {
      energyAvailable: 150
    } as Room

    const roomMemory = {
      threats: {
        enemyCreepCount: 2,
        enemyPowerCreepCount: 0,
        enemyStructures: [],
        lastObserved: Game.time || 0
      }
    } as any

    const spawnsAvailable: StructureSpawn[] = []

    const result = spawnGuards({
      guardCount: 0,
      room,
      roomMemory,
      roomName: 'W1N1',
      spawnsAvailable
    })

    expect(spawnCreepSpy.notCalled).to.be.true
    expect(result.length).to.equal(0)
  })
})
