import { expect } from 'chai'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'
import { UpgraderState } from '../../src/stateMachines/upgrader-machine'
import { runUpgraderCreep } from '../../src/creepProcessors/upgrader'
import { SharedCreepState } from 'types'

describe('upgrader processor', () => {
  // @ts-ignore
  global.RESOURCE_ENERGY = 'energy'
  // @ts-ignore
  global.FIND_DROPPED_RESOURCES = 106
  // @ts-ignore
  global.FIND_TOMBSTONES = 118
  // @ts-ignore
  global.FIND_RUINS = 123
  // @ts-ignore
  global.FIND_STRUCTURES = 107

  let creep: any
  let sandbox: sinon.SinonSandbox
  let isNearToStub: sinon.SinonStub
  let creepInRangeToStub: sinon.SinonStub
  let controllerInRangeToStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()
    sandbox = sinon.createSandbox()
    const droppedEnergy = { id: 'energy1', resourceType: RESOURCE_ENERGY, amount: 100, pos: { x: 5, y: 5, roomName: 'W1N1' } } as Resource
    const mockSource = { id: 'src1', pos: { x: 5, y: 5, roomName: 'W1N1' }, energy: 300 } as Source
    controllerInRangeToStub = sandbox.stub().returns(true)
    const mockController = { pos: { x: 20, y: 20, roomName: 'W1N1', inRangeTo: controllerInRangeToStub } as unknown as RoomPosition } as StructureController
    const find = (type: number) => {
      if (type === FIND_SOURCES) {
        return [mockSource]
      }
      return []
    }
    isNearToStub = sandbox.stub().returns(true)
    creepInRangeToStub = sandbox.stub().returns(true)
    creep = {
      name: 'TestUpgrader',
      memory: { task: { type: 'upgrade', controllerId: 'ctrl1', controllerPosition: { x: 20, y: 20, roomName: 'W1N1' } } },
      store: {
        getUsedCapacity: sandbox.stub().returns(0),
        getCapacity: sandbox.stub().returns(50)
      },
      pos: {
        isNearTo: isNearToStub,
        findClosestByRange: sandbox.stub().returns(mockSource),
        findClosestByPath: sandbox.stub().returns(droppedEnergy),
        inRangeTo: creepInRangeToStub,
        x: 10,
        y: 10
      },
      moveTo: sandbox.stub(),
      harvest: sandbox.stub(),
      withdraw: sandbox.stub(),
      room: {
        find,
        controller: mockController
      },
      say: sandbox.stub(),
      upgradeController: sandbox.stub(),
    }
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should transition from idle to collecting if collect task is available', () => {
    creep.memory.task = {
      type: 'upgrade',
      controllerId: 'ctrl1',
      controllerPosition: { x: 5, y: 5, roomName: 'W1N1' }
    }
    runUpgraderCreep(creep)
    expect(creep.memory.state).to.equal(UpgraderState.collecting)
    expect(creep.say.calledWith('🔋')).to.be.true
  })

  it('should transition from collecting to upgrading when full', () => {
    creep.memory.state = UpgraderState.collecting
    creep.memory.task = {
      type: 'upgrade',
      controllerId: 'ctrl1',
      controllerPosition: { x: 5, y: 5, roomName: 'W1N1' }
    }
    creep.store.getUsedCapacity.returns(50)
    runUpgraderCreep(creep)
    expect(creep.memory.state).to.equal(UpgraderState.upgrading)
    expect(creep.say.calledWith('⚡')).to.be.true
  })

  it('should transition from upgrading to collecting when empty', () => {
    creep.memory.state = UpgraderState.upgrading
    creep.memory.task = {
      type: 'upgrade',
      controllerId: 'ctrl1',
      controllerPosition: { x: 5, y: 5, roomName: 'W1N1' }
    }
    creep.store.getUsedCapacity.returns(0)
    runUpgraderCreep(creep)
    expect(creep.memory.state).to.equal(UpgraderState.collecting)
    expect(creep.say.calledWith('🔋')).to.be.true
  })

  it('should move to and upgrade controller in upgrading state', () => {
    creep.memory.state = UpgraderState.upgrading
    creep.memory.task = {
      type: 'upgrade',
      controllerId: 'ctrl1',
      controllerPosition: { x: 20, y: 20, roomName: 'W1N1' }
    }
    creep.store.getUsedCapacity.returns(10)
    creepInRangeToStub.returns(false)
    runUpgraderCreep(creep)
    expect(creep.moveTo.args[0]).to.deep.equal([20,20,{ reusePath: 5, visualizePathStyle: { stroke: '#0000ff' } }])
    expect(creep.upgradeController.called).to.be.true
    expect(creep.memory.state).to.equal(UpgraderState.upgrading)
  })

  it('should move to and withdraw from source in collecting state', () => {
    creep.memory.state = UpgraderState.collecting
    creep.memory.task = {
      type: 'upgrade',
      controllerId: 'ctrl1',
      controllerPosition: { x: 5, y: 5, roomName: 'W1N1' }
    }
    runUpgraderCreep(creep)
    expect(creep.withdraw.called).to.be.true
    expect(creep.memory.state).to.equal(UpgraderState.collecting)
  })
})
