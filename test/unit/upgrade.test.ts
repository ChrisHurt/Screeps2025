import { expect } from 'chai'
import * as sinon from 'sinon'
import { upgrade } from '../../src/behaviours/upgraderBehaviours/upgrade'
import { UpgraderState } from '../../src/stateMachines/upgrader-machine'
import { SharedCreepState } from '../../src/types'

describe('upgrade behaviour', () => {
  let creep: any
  let controller: any
  let creepPos: any
  let upgraderService: any
  let context: any
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
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
      moveTo: sandbox.stub()
    }
    upgraderService = { send: sandbox.stub() }
    context = { energy: 10 }
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should return collecting state if energy is 0', () => {
    context.energy = 0
    const result = upgrade({ creep, context, upgraderService })
    expect(upgraderService.send.calledWith({ type: 'empty' })).to.be.true
    expect(result.state).to.equal(UpgraderState.collecting)
    expect(result.continue).to.be.true
  })

  it('should return idle state if controller is missing', () => {
    creep.room.controller = null
    const result = upgrade({ creep, context, upgraderService })
    expect(upgraderService.send.calledWith({ type: 'idle' })).to.be.true
    expect(result.state).to.equal(SharedCreepState.idle)
    expect(result.continue).to.be.true
  })

  it('should call upgradeController if in range', () => {
  controller.pos.inRangeTo.returns(true)
  creepPos.inRangeTo.returns(false)
    const result = upgrade({ creep, context, upgraderService })
    expect(creep.upgradeController.calledWith(controller)).to.be.true
    expect(result.state).to.equal(UpgraderState.upgrading)
    expect(result.continue).to.be.false
  })

  it('should not call upgradeController if not in range', () => {
  controller.pos.inRangeTo.returns(false)
  creepPos.inRangeTo.returns(false)
    const result = upgrade({ creep, context, upgraderService })
    expect(creep.upgradeController.called).to.be.false
    expect(result.state).to.equal(UpgraderState.upgrading)
    expect(result.continue).to.be.false
  })
})
