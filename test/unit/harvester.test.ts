import { expect } from 'chai'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'
import { runHarvesterCreep } from 'creepProcessors/harvester'
import { SharedCreepState } from 'types'

describe('harvester processor', () => {
  let creep: any
  let sandbox: sinon.SinonSandbox
  let isNearToStub: sinon.SinonStub
  let inRangeToStub: sinon.SinonStub
  let renewCreepStub: sinon.SinonStub
  let recycleCreepStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()
    sandbox = sinon.createSandbox()
    renewCreepStub = sandbox.stub()
    recycleCreepStub = sandbox.stub()
    const mockSource = { id: 'src1', pos: { x: 5, y: 5, roomName: 'W1N1' }, energyCapacity: 300 } as Source
    const mockSpawn = { id: 'spawn1', pos: { x: 10, y: 10, roomName: 'W1N1' }, recycleCreep: recycleCreepStub, renewCreep: renewCreepStub, spawning: false } as unknown as StructureSpawn
    const find = (type: number) => {
      if (type === FIND_SOURCES) {
        return [mockSource]
      }
      if (type === FIND_MY_SPAWNS) {
        return [mockSpawn]
      }
      return []
    }
    isNearToStub = sandbox.stub().returns(true)
    inRangeToStub = sandbox.stub().returns(true)
    creep = {
      name: 'TestCreep',
      memory: {},
      store: {
        getUsedCapacity: sandbox.stub().returns(0),
        getCapacity: sandbox.stub().returns(50)
      },
      pos: {
        isNearTo: isNearToStub,
        inRangeTo: inRangeToStub,
        findInRange: sandbox.stub().returns([mockSource]),
        x: 10,
        y: 10
      },
      moveTo: sandbox.stub(),
      harvest: sandbox.stub(),
      room: {
        find
      },
      say: sandbox.stub(),
      transfer: sandbox.stub(),
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should transition from idle to harvesting if harvest task is available', () => {
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 10, y: 10 },
      workParts: 1
    }
    runHarvesterCreep(creep)
    expect(creep.moveTo.called).to.be.false
    expect(creep.harvest.called).to.be.true
  })

  it('should log if no harvest task', () => {
    const logSpy = sandbox.spy(console, 'log')
    creep.memory.task = undefined
    runHarvesterCreep(creep)
    expect(logSpy.args[0][0]).to.equal('Invalid creep task for harvester: undefined')
  })

  it('should move to source if not adjacent during harvesting', () => {
    creep.memory.state = SharedCreepState.harvesting
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 20, y: 20 },
      workParts: 1
    }
    isNearToStub.returns(false)
    runHarvesterCreep(creep)
    expect(creep.moveTo.args[0]).to.deep.equal([20,20, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } }])
    expect(creep.moveTo.called).to.be.true
  })

  it('should become idle if target source does not exist', () => {
    creep.memory.state = SharedCreepState.harvesting
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 20, y: 20 },
      workParts: 1
    }
    creep.room.find = () => [] // Simulate no sources found
    runHarvesterCreep(creep)
    expect(creep.moveTo.called).to.be.false
    expect(creep.harvest.called).to.be.false
    expect(creep.memory.state).to.equal(SharedCreepState.idle)
  })

  it('should move to spawn if not adjacent during depositing', () => {
    creep.memory.state = SharedCreepState.depositingEnergy
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 20, y: 20 },
      workParts: 1
    }
    creep.store.getUsedCapacity.returns(50)
    isNearToStub.returns(false)
    runHarvesterCreep(creep)
    expect(creep.moveTo.args[0]).to.deep.equal([10,10, { reusePath: 5, visualizePathStyle: { stroke: '#fff' } }])
    expect(creep.moveTo.called).to.be.true
  })

  it('should move to spawn, transfer and be renewed during depositing', () => {
    creep.memory.state = SharedCreepState.depositingEnergy
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 20, y: 20 },
      workParts: 1
    }
    creep.ticksToLive = 1000
    creep.store.getUsedCapacity.returns(50)
    isNearToStub.returns(false)
    inRangeToStub.returns(true)
    runHarvesterCreep(creep)
    expect(creep.moveTo.args[0]).to.deep.equal([10,10, { reusePath: 5, visualizePathStyle: { stroke: '#fff' } }])
    expect(creep.harvest).not.to.be.called
    expect(creep.transfer).to.be.called
    expect(renewCreepStub).to.be.called
  })

  it('should harvest source if adjacent during harvesting', () => {
    creep.memory.state = SharedCreepState.harvesting
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 20, y: 20 },
      workParts: 1
    }
    runHarvesterCreep(creep)
    expect(creep.moveTo).not.to.be.called
    expect(creep.harvest.called).to.be.true
  })

  it('should not harvest source if not adjacent during harvesting', () => {
    creep.memory.state = SharedCreepState.harvesting
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 20, y: 20 },
      workParts: 1
    }
    isNearToStub.returns(false)
    inRangeToStub.returns(false)
    runHarvesterCreep(creep)
    expect(creep.moveTo.called).to.be.true
    expect(creep.harvest.called).to.be.false
  })

  it('should send full event and continue if energy is full during harvesting', () => {
    creep.memory.state = SharedCreepState.harvesting
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 10, y: 10 },
      workParts: 1
    }
    creep.store.getUsedCapacity.returns(50)
    runHarvesterCreep(creep)
    expect(creep.moveTo.called).to.be.false
    expect(creep.harvest.called).to.be.false
  })

  it('should log error and not continue if harvesting with invalid task', () => {
    creep.memory.state = SharedCreepState.harvesting
    creep.memory.task = { type: 'deposit' }
    const logSpy = sandbox.spy(console, 'log')
    runHarvesterCreep(creep)
    expect(logSpy.args[0][0]).to.equal('Invalid creep task for harvester: {"type":"deposit"}')
  })

  it('should send deposited event and continue if energy is empty during depositing', () => {
    creep.memory.state = SharedCreepState.depositingEnergy
    creep.memory.task = { type: 'deposit' }
    creep.store.getUsedCapacity.returns(0)
    runHarvesterCreep(creep)
    expect(creep.moveTo.called).to.be.false
    expect(creep.harvest.called).to.be.false
  })

  it('should handle long creep idle state', () => {
    creep.memory.state = SharedCreepState.idle
    creep.memory.task = { type: 'harvest' }
    creep.memory.idleStarted = 1000
    global.Game.time = 1051
    const logSpy = sandbox.spy(console, 'log')
    runHarvesterCreep(creep)
    expect(logSpy.args[0][0]).to.equal('Creep TestCreep has been idle for too long, recycling.')
  })

  it('should handle short creep idle state', () => {
    creep.memory.state = SharedCreepState.idle
    creep.memory.task = { type: 'harvest' }
    creep.memory.idleStarted = 1000
    global.Game.time = 1005
    const logSpy = sandbox.spy(console, 'log')
    runHarvesterCreep(creep)
    expect(logSpy.notCalled).to.be.true
  })
})
