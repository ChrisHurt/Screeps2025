import { describe, it, beforeEach, afterEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { spawnCreeps } from '../../src/spawning/spawnCreeps'
import { setupGlobals } from '../helpers/setupGlobals'

// Import the individual spawn functions to mock them
import * as spawnGuards from '../../src/spawning/spawnGuards'
import * as spawnHarvesters from '../../src/spawning/spawnHarvesters'
import * as spawnBuilders from '../../src/spawning/spawnBuilders'
import * as spawnUpgraders from '../../src/spawning/spawnUpgraders'
import * as spawnHaulers from '../../src/spawning/spawnHaulers'

describe.skip('spawnCreeps', () => {
  let spawnGuardsStub: sinon.SinonStub
  let spawnHarvestersStub: sinon.SinonStub
  let spawnBuildersStub: sinon.SinonStub
  let spawnUpgradersStub: sinon.SinonStub
  let spawnHaulersStub: sinon.SinonStub
  let mockSpawn: any
  let mockRoom: any

  beforeEach(() => {
    setupGlobals()
    // Create stubs for all spawn functions
    spawnGuardsStub = sinon.stub(spawnGuards, 'spawnGuards').returns([mockSpawn])
    spawnHarvestersStub = sinon.stub(spawnHarvesters, 'spawnHarvesters').returns({
      harvestTasksNeedCreeps: false,
      spawnsAvailable: [mockSpawn]
    })
    spawnBuildersStub = sinon.stub(spawnBuilders, 'spawnBuilders').returns([mockSpawn])
    spawnUpgradersStub = sinon.stub(spawnUpgraders, 'spawnUpgraders').returns([mockSpawn])
    spawnHaulersStub = sinon.stub(spawnHaulers, 'spawnHaulers').returns([])

    mockSpawn = {
      id: 'Spawn1',
      spawning: null,
      spawnCreep: sinon.spy()
    }

    mockRoom = {
      name: 'W1N1',
      energyAvailable: 300,
      find: sinon.stub(),
      controller: {
        id: 'ctrl1',
        pos: { x: 1, y: 1, roomName: 'W1N1' }
      }
    }

    // Mock the find method to return spawns and creeps
    mockRoom.find.withArgs(FIND_MY_SPAWNS).returns([mockSpawn])
    mockRoom.find.withArgs(FIND_MY_CREEPS).returns([])

    // Setup global Game state
    Game.rooms = { 'W1N1': mockRoom }
    Game.creeps = {}
    
    Memory.rooms = {
      'W1N1': {
        effectiveEnergyPerTick: 5,
        totalSourceEnergyPerTick: 10,
        tasks: {
          harvest: [],
          build: [],
          upgrade: {
            availablePositions: [new RoomPosition(1, 1, 'W1N1')],
            controllerId: 'ctrl1',
            controllerPosition: new RoomPosition(1, 1, 'W1N1'),
            roomName: 'W1N1',
            reservingCreeps: {}
          }
        }
      } as any
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should call spawnGuards with correct parameters', () => {
    spawnCreeps()

    expect(spawnGuardsStub.calledOnce).to.be.true
    expect(spawnGuardsStub.firstCall.args[0].room.name).to.equal('W1N1')
    expect(spawnGuardsStub.firstCall.args[0].room.energyAvailable).to.equal(300)
    expect(spawnGuardsStub.firstCall.args[0].room.find).to.be.a('function')
    console.log(spawnGuardsStub.firstCall.args[1])

    expect(spawnGuardsStub.firstCall.args[1]).to.deep.equal(mockSpawn)
  })

  it('should call spawnHarvesters with correct parameters', () => {
    spawnCreeps()

    expect(spawnHarvestersStub.calledOnce).to.be.true
    expect(spawnHarvestersStub.firstCall.args[0]).to.equal(mockRoom)
    expect(spawnHarvestersStub.firstCall.args[1]).to.deep.equal([mockSpawn])
  })

  it('should call spawnBuilders with correct parameters', () => {
    spawnCreeps()

    expect(spawnBuildersStub.calledOnce).to.be.true
    expect(spawnBuildersStub.firstCall.args[0]).to.equal(mockRoom)
    expect(spawnBuildersStub.firstCall.args[1]).to.deep.equal([mockSpawn])
  })

  it('should call spawnUpgraders with correct parameters', () => {
    spawnCreeps()

    expect(spawnUpgradersStub.calledOnce).to.be.true
    expect(spawnUpgradersStub.firstCall.args[0]).to.equal(mockRoom)
    expect(spawnUpgradersStub.firstCall.args[1]).to.deep.equal([mockSpawn])
  })

  it('should call spawnHaulers with correct parameters', () => {
    spawnCreeps()

    expect(spawnHaulersStub.calledOnce).to.be.true
    expect(spawnHaulersStub.firstCall.args[0]).to.equal(mockRoom)
    expect(spawnHaulersStub.firstCall.args[1]).to.deep.equal([mockSpawn])
  })

  it('should call all spawn functions in correct order', () => {
    spawnCreeps()

    expect(spawnGuardsStub.calledBefore(spawnHarvestersStub)).to.be.true
    expect(spawnHarvestersStub.calledBefore(spawnBuildersStub)).to.be.true
    expect(spawnBuildersStub.calledBefore(spawnUpgradersStub)).to.be.true
    expect(spawnUpgradersStub.calledBefore(spawnHaulersStub)).to.be.true
  })

  it('should handle spawns being modified by spawn functions', () => {
    // Simulate a spawn function consuming a spawn
    spawnGuardsStub.callsFake((room, spawns) => {
      spawns.pop() // Remove the spawn
      return spawns
    })

    spawnCreeps()

    expect(spawnGuardsStub.calledOnce).to.be.true
    expect(spawnHarvestersStub.calledOnce).to.be.true
    expect(spawnHarvestersStub.firstCall.args[1]).to.deep.equal([]) // Empty array after spawn consumed
  })

  it('should pass updated spawn arrays between functions', () => {
    const secondSpawn = {
      id: 'Spawn2',
      spawning: null,
      spawnCreep: sinon.spy()
    }

    mockRoom.find.withArgs(FIND_MY_SPAWNS).returns([mockSpawn, secondSpawn])

    // First function consumes one spawn
    spawnGuardsStub.callsFake((room, spawns) => {
      spawns.pop()
      return spawns
    })

    spawnCreeps()

    expect(spawnGuardsStub.firstCall.args[1]).to.have.length(2)
    expect(spawnHarvestersStub.firstCall.args[1]).to.have.length(1)
    expect(spawnBuildersStub.firstCall.args[1]).to.have.length(1)
  })

  it('should work with multiple rooms', () => {
    const mockRoom2 = {
      name: 'W2N2',
      energyAvailable: 500,
      find: sinon.stub(),
      controller: {
        id: 'ctrl2',
        pos: { x: 2, y: 2, roomName: 'W2N2' }
      }
    }

    const mockSpawn2 = {
      id: 'Spawn2',
      spawning: null,
      spawnCreep: sinon.spy()
    }

    mockRoom2.find.withArgs(FIND_MY_SPAWNS).returns([mockSpawn2])
    mockRoom2.find.withArgs(FIND_MY_CREEPS).returns([])

    ;(Game.rooms as any)['W2N2'] = mockRoom2
    Memory.rooms['W2N2'] = {
      effectiveEnergyPerTick: 8,
      totalSourceEnergyPerTick: 15,
      tasks: {
        harvest: [],
        build: [],
        upgrade: {
          availablePositions: [new RoomPosition(2, 2, 'W2N2')],
          controllerId: 'ctrl2',
          controllerPosition: new RoomPosition(2, 2, 'W2N2'),
          roomName: 'W2N2',
          reservingCreeps: {}
        }
      }
    } as any

    spawnCreeps()

    // Each function should be called twice (once per room)
    expect(spawnGuardsStub.callCount).to.equal(2)
    expect(spawnHarvestersStub.callCount).to.equal(2)
    expect(spawnBuildersStub.callCount).to.equal(2)
    expect(spawnUpgradersStub.callCount).to.equal(2)
    expect(spawnHaulersStub.callCount).to.equal(2)
  })

  it('should skip rooms without spawns', () => {
    mockRoom.find.withArgs(FIND_MY_SPAWNS).returns([])

    spawnCreeps()

    expect(spawnGuardsStub.called).to.be.false
    expect(spawnHarvestersStub.called).to.be.false
    expect(spawnBuildersStub.called).to.be.false
    expect(spawnUpgradersStub.called).to.be.false
    expect(spawnHaulersStub.called).to.be.false
  })
})
