import { expect } from 'chai'
import * as sinon from 'sinon'
import { upgrade } from '../../src/behaviours/upgraderBehaviours/upgrade'
import { SharedCreepState } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'


describe('upgrade behaviour', () => {
  let creep: any
  let controller: any
  let creepPos: any
  let upgraderService: any
  let context: any
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    setupGlobals()
    sandbox = sinon.createSandbox()
    controller = {
      pos: {
        inRangeTo: sandbox.stub().returns(false)
      }
    }
    creepPos = {
      inRangeTo: sandbox.stub().returns(false),
      x: 10,
      y: 10
    }
    creep = {
      room: { controller },
      upgradeController: sandbox.stub(),
      pos: creepPos,
      moveTo: sandbox.stub(),
      store: {
        getUsedCapacity: (resource: string) => resource === RESOURCE_ENERGY ? 50 : 0
      }
    }
    upgraderService = { send: sandbox.stub() }
    context = { energy: 10 }
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should return collecting state if energy is 0', () => {
    context.energy = 0
    const result = upgrade({ creep, context, service: upgraderService })
    expect(upgraderService.send.calledWith({ type: 'empty' })).to.be.true
    expect(result.state).to.equal(SharedCreepState.collectingEnergy)
    expect(result.continue).to.be.true
  })

  it('should return idle state if controller is missing', () => {
    creep.room.controller = null
    const result = upgrade({ creep, context, service: upgraderService })
    expect(upgraderService.send.calledWith({ type: 'idle' })).to.be.true
    expect(result.state).to.equal(SharedCreepState.idle)
    expect(result.continue).to.be.true
  })

  it('should call upgradeController if in range', () => {
    const upgradeControllerSpy = sinon.spy()
    const mockController = { id: 'ctrl1', pos: { x: 1, y: 1, roomName: 'W1N1', inRangeTo: () => true } }
    const mockCreep = {
      store: {
        getUsedCapacity: (resource: string) => resource === RESOURCE_ENERGY ? 50 : 0
      },
      pos: {
        getRangeTo: () => 1,
        inRangeTo: () => true
      },
      upgradeController: upgradeControllerSpy,
      memory: {},
      room: { controller: mockController }
    }
    controller.pos.inRangeTo.returns(true)
    creepPos.inRangeTo.returns(false)
    const result = upgrade({ creep: mockCreep as any, context, service: upgraderService })
    expect(upgradeControllerSpy.calledWith(mockController)).to.be.true
    expect(result.state).to.equal(SharedCreepState.upgrading)
    expect(result.continue).to.be.false
  })

  it('should not call upgradeController if not in range', () => {
    controller.pos.inRangeTo.returns(false)
    creepPos.inRangeTo.returns(false)
    const result = upgrade({ creep, context, service: upgraderService })
    expect(creep.upgradeController.called).to.be.false
    expect(result.state).to.equal(SharedCreepState.upgrading)
    expect(result.continue).to.be.false
  })

  it('should transition to collecting state after energy is depleted', () => {
    controller.pos.inRangeTo.returns(true)
    // Mock creep with no energy
    creep.store.getUsedCapacity = (resource: string) => resource === RESOURCE_ENERGY ? 0 : 0
    
    const result = upgrade({ creep, context, service: upgraderService })
    
    expect(upgraderService.send.calledWith({ type: 'empty' })).to.be.true
    expect(result.state).to.equal(SharedCreepState.collectingEnergy)
    expect(result.continue).to.be.true
  })

  it('should move to controller if not in range', () => {
    controller.pos.inRangeTo.returns(false)
    creepPos.inRangeTo.returns(false)
    
    const result = upgrade({ creep, context, service: upgraderService })
    
    expect(creep.moveTo.calledWith(controller.pos.x, controller.pos.y)).to.be.true
    expect(result.state).to.equal(SharedCreepState.upgrading)
    expect(result.continue).to.be.false
  })
})
