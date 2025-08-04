import { expect } from 'chai'
import * as sinon from 'sinon'
import { interpret, Service } from 'robot3'
import { setupGlobals } from '../helpers/setupGlobals'
import { createHarvesterMachine, HarvesterState, HarvesterEventType, HarvesterContext } from '../../src/stateMachines/harvester-machine'
import { runHarvesterCreep } from '../../src/harvester'
import { log } from 'console'

describe('runHarvesterCreep and processCurrentHarvesterState', () => {
  // Define RESOURCE_ENERGY for test environment
  // @ts-ignore
  global.RESOURCE_ENERGY = 'energy'
  let creep: any
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    setupGlobals()
    sandbox = sinon.createSandbox()
    creep = {
      name: 'TestCreep',
      memory: {},
      store: {
        getUsedCapacity: sandbox.stub().returns(0),
        getCapacity: sandbox.stub().returns(50)
      },
      pos: {
        isNearTo: sandbox.stub().returns(true),
        findInRange: sandbox.stub().returns([{ id: 'source1' }]),
        x: 10,
        y: 10
      },
      moveTo: sandbox.stub(),
      harvest: sandbox.stub()
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should transition from idle to harvesting if harvest task is available', () => {
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'source1',
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
      sourceId: 'source1',
      sourcePosition: { x: 20, y: 20 },
      workParts: 1
    }
    creep.pos.isNearTo.returns(false)
    runHarvesterCreep(creep)
    expect(creep.moveTo.calledWith({ x: 20, y: 20 })).to.be.true
    expect(creep.harvest.called).to.be.false
  })

  it('should send full event and continue if energy is full during harvesting', () => {
    creep.memory.state = HarvesterState.harvesting
    creep.memory.task = {
      type: 'harvest',
      sourceId: 'source1',
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
    const errorSpy = sandbox.spy(console, 'error')
    runHarvesterCreep(creep)
    expect(errorSpy.calledWithMatch(/Invalid creep task for harvesting/)).to.be.true
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
