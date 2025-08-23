import { depositEnergy } from 'behaviours/depositEnergy'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { SharedCreepEventType, SharedCreepState } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('depositEnergy', () => {
  let creep: any
  let context: any
  let service: any
  let spawn: any

  beforeEach(() => {
    setupGlobals()
    spawn = {
      pos: { x: 10, y: 20, isNearTo: sinon.stub().returns(true), inRangeTo: sinon.stub().returns(true) },
      spawning: null,
      renewCreep: sinon.spy(),
      transfer: sinon.spy()
    }
    creep = {
      name: 'TestCreep',
      room: { find: sinon.stub().returns([spawn]) },
      pos: {
        isNearTo: sinon.stub().returns(true),
        inRangeTo: sinon.stub().returns(true),
        x: 10,
        y: 20
      },
      moveTo: sinon.spy(),
      transfer: sinon.spy(),
      ticksToLive: 1000
    }
    context = { energy: 50 }
    service = { send: sinon.spy() }
    // @ts-ignore
    global.RESOURCE_ENERGY = 'energy'
    // @ts-ignore
    global.CREEP_LIFE_TIME = 1500
  })

  it('should send empty event and return idle if creep is empty', () => {
    context.energy = 0
    const result = depositEnergy({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.empty })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send idle event and return idle if no spawn found', () => {
    creep.room.find.returns([])
    const result = depositEnergy({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should move creep to spawn if not near', () => {
    creep.pos.isNearTo.returns(false)
    creep.pos.inRangeTo.returns(false)
    creep.moveTo = sinon.spy()
    const result = depositEnergy({ creep, context, service })
    expect(creep.moveTo.calledWith(spawn.pos.x, spawn.pos.y)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: 'depositing' })
  })

  it('should transfer energy and renew creep if in range', () => {
    creep.pos.inRangeTo.returns(true)
    creep.ticksToLive = 1000
    spawn.spawning = null
    spawn.renewCreep = sinon.spy()
    creep.transfer = sinon.spy()
    const result = depositEnergy({ creep, context, service })
    expect(creep.transfer.calledWith(spawn, RESOURCE_ENERGY)).to.be.true
    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should not renew creep if ticksToLive is high', () => {
    creep.pos.inRangeTo.returns(true)
    creep.ticksToLive = 1400
    spawn.spawning = null
    spawn.renewCreep = sinon.spy()
    creep.transfer = sinon.spy()
    const result = depositEnergy({ creep, context, service })
    expect(creep.transfer.calledWith(spawn, RESOURCE_ENERGY)).to.be.true
    expect(spawn.renewCreep.notCalled).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })
})
