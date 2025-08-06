import { expect } from 'chai'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'
import { HarvesterState } from '../../src/stateMachines/harvester-machine'
import { runHarvesterCreep } from '../../src/harvester'

describe('runHarvesterCreep', () => {
  // Define RESOURCE_ENERGY for test environment
  // @ts-ignore
  global.RESOURCE_ENERGY = 'energy'
  let creep: any
  let sandbox: sinon.SinonSandbox
  let isNearToStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()
    sandbox = sinon.createSandbox()
    const mockSource = { id: 'src1', pos: { x: 5, y: 5, roomName: 'W1N1' }, energyCapacity: 300 } as Source
    const mockSpawn = { id: 'spawn1', pos: { x: 10, y: 10, roomName: 'W1N1' } } as StructureSpawn
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
    creep = {
      name: 'TestCreep',
      memory: {},
      store: {
        getUsedCapacity: sandbox.stub().returns(0),
        getCapacity: sandbox.stub().returns(50)
      },
      pos: {
        isNearTo: isNearToStub,
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

  it('should log and not continue if idle for too long and no harvest task', () => {
    const logSpy = sandbox.spy(console, 'log')
    creep.memory.task = undefined
    runHarvesterCreep(creep)
    expect(logSpy.calledWithMatch(/idle for too long/)).to.be.true
  })

  it('should move to source if not adjacent during harvesting', () => {
    creep.memory.state = HarvesterState.harvesting
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
    creep.memory.state = HarvesterState.harvesting
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
    expect(creep.memory.state).to.equal(HarvesterState.idle)
  })

  it('should move to spawn if not adjacent during depositing', () => {
    creep.memory.state = HarvesterState.depositing
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

  it('should harvest source if adjacent during harvesting', () => {
    creep.memory.state = HarvesterState.harvesting
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

  it('should send full event and continue if energy is full during harvesting', () => {
    creep.memory.state = HarvesterState.harvesting
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'src1',
      sourcePosition: { x: 10, y: 10 },
      workParts: 1
    }
    creep.store.getUsedCapacity.returns(50)
    runHarvesterCreep(creep)
    // Should not call moveTo or harvest
    expect(creep.moveTo.called).to.be.false
    expect(creep.harvest.called).to.be.false
  })

  it('should log error and not continue if harvesting with invalid task', () => {
    creep.memory.state = HarvesterState.harvesting
    creep.memory.task = { type: 'deposit' }
    const logSpy = sandbox.spy(console, 'log')
    runHarvesterCreep(creep)
    expect(logSpy.calledWithMatch(/Invalid creep task for harvesting/)).to.be.true
  })

  it('should send deposited event and continue if energy is empty during depositing', () => {
    creep.memory.state = HarvesterState.depositing
    creep.memory.task = { type: 'deposit' }
    creep.store.getUsedCapacity.returns(0)
    runHarvesterCreep(creep)
    // Should not call moveTo or harvest
    expect(creep.moveTo.called).to.be.false
    expect(creep.harvest.called).to.be.false
  })

  it('should handle long creep idle state', () => {
    creep.memory.state = HarvesterState.idle
    creep.memory.task = {}
    creep.memory.idleStarted = 1000
    global.Game.time = 1051
    const logSpy = sandbox.spy(console, 'log')
    runHarvesterCreep(creep)
    expect(logSpy.calledWithMatch(/idle for too long/)).to.be.true
  })
})
