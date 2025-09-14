import { depositEnergyByReservation } from 'behaviours/depositEnergyByReservation'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { SharedCreepEventType, SharedCreepState } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('depositEnergyByReservation', () => {
  let creep: any
  let context: any
  let service: any
  let recipient: any

  beforeEach(() => {
    setupGlobals()
    
    recipient = {
      id: 'recipient123',
      pos: { x: 10, y: 20 },
      store: {
        getUsedCapacity: sinon.stub().returns(10),
        getFreeCapacity: sinon.stub().returns(50)
      },
      structureType: 'container',
      spawning: null,
      renewCreep: sinon.spy()
    }

    creep = {
      name: 'TestCreep',
      room: { name: 'W1N1' },
      pos: {
        isNearTo: sinon.stub().returns(true),
        inRangeTo: sinon.stub().returns(true),
        x: 10,
        y: 20
      },
      store: {
        energy: 40,
        getCapacity: sinon.stub().returns(50),
        getFreeCapacity: sinon.stub().returns(10),
        getUsedCapacity: sinon.stub().returns(40)
      },
      transfer: sinon.stub(),
      drop: sinon.stub(),
      moveTo: sinon.stub(),
      ticksToLive: 1000
    }

    context = {
      energy: 40,
      capacity: 50,
      recipient: 'recipient123',
      deliveryMethod: 'transfer',
      amountReserved: 30
    }

    service = { send: sinon.spy() }

    // Mock Game.getObjectById
    // @ts-ignore
    global.Game = {
      getObjectById: sinon.stub().returns(recipient)
    }

    // @ts-ignore
    global.RESOURCE_ENERGY = 'energy'
    // @ts-ignore
    global.CREEP_LIFE_TIME = 1500
    // @ts-ignore
    global.OK = 0
    // @ts-ignore
    global.ERR_NOT_ENOUGH_RESOURCES = -6
    // @ts-ignore
    global.ERR_FULL = -8
    // @ts-ignore
    global.ERR_INVALID_TARGET = -7
  })

  it('should send empty event and return idle if creep has no energy', () => {
    context.energy = 0
    const result = depositEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.empty })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send idle event and return idle if recipient not found', () => {
    // @ts-ignore
    Game.getObjectById.returns(null)
    const result = depositEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should move creep to recipient if not in range', () => {
    creep.pos.isNearTo.returns(false)

    const result = depositEnergyByReservation({ creep, context, service })
    
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })

  it('should transfer energy to structure recipient when in range', () => {
    creep.pos.isNearTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)

    const result = depositEnergyByReservation({ creep, context, service })

    expect(creep.transfer.calledWith(recipient, RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })

  it('should drop energy when deliveryMethod is drop', () => {
    context.deliveryMethod = 'drop'
    creep.pos.isNearTo.returns(true)
    creep.drop = sinon.stub().returns(OK)

    const result = depositEnergyByReservation({ creep, context, service })

    expect(creep.drop.calledWith(RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })

  it('should send empty event if creep becomes empty after transfer', () => {
    creep.pos.isNearTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)
    creep.store.getUsedCapacity.returns(0) // Creep is now empty

    const result = depositEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.empty })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should handle spawn renewal when transferring to spawn', () => {
    creep.pos.isNearTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)
    creep.ticksToLive = 1000
    recipient.spawning = null
    recipient.renewCreep = sinon.spy()
    recipient.structureType = STRUCTURE_SPAWN

    depositEnergyByReservation({ creep, context, service })

    expect(recipient.renewCreep.calledWith(creep)).to.be.true
  })

  it('should handle creep-to-creep energy transfer', () => {
    creep.pos.isNearTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)
    
    // Make recipient a creep by removing structure properties and adding creep properties
    delete recipient.store
    delete recipient.structureType
    recipient.transfer = sinon.stub() // Creeps have transfer method

    const result = depositEnergyByReservation({ creep, context, service })

    expect(creep.transfer.calledWith(recipient, RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })

  it('should send idle if recipient is full', () => {
    creep.pos.isNearTo.returns(true)
    creep.transfer = sinon.stub().returns(ERR_FULL)

    const result = depositEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send empty event if creep has no resources', () => {
    creep.pos.isNearTo.returns(true)
    creep.transfer = sinon.stub().returns(ERR_NOT_ENOUGH_RESOURCES)

    const result = depositEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.empty })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should continue depositing on other errors', () => {
    creep.pos.isNearTo.returns(true)
    creep.transfer = sinon.stub().returns(-1) // Some other error

    const result = depositEnergyByReservation({ creep, context, service })

    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })

  it('should use the exact amount reserved for transfer', () => {
    creep.pos.isNearTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)
    context.amountReserved = 25

    depositEnergyByReservation({ creep, context, service })

    expect(creep.transfer.calledWith(recipient, RESOURCE_ENERGY, 25)).to.be.true
  })
})
