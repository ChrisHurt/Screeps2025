import { collectEnergyByReservation } from 'behaviours/collectEnergyByReservation'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { SharedCreepEventType, SharedCreepState } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('collectEnergyByReservation', () => {
  let creep: any
  let context: any
  let service: any
  let supplier: any

  beforeEach(() => {
    setupGlobals()
    
    supplier = {
      id: 'supplier123',
      pos: { x: 10, y: 20 },
      store: {
        getUsedCapacity: sinon.stub().returns(100),
        getFreeCapacity: sinon.stub().returns(50)
      },
      structureType: 'container',
      spawning: null,
      renewCreep: sinon.spy(),
      transfer: sinon.spy()
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
        energy: 10,
        getCapacity: sinon.stub().returns(50),
        getFreeCapacity: sinon.stub().returns(40),
        getUsedCapacity: sinon.stub().returns(10)
      },
      withdraw: sinon.stub(),
      moveTo: sinon.stub(),
      ticksToLive: 1000
    }

    context = {
      energy: 10,
      capacity: 50,
      supplier: 'supplier123',
      amountReserved: 30
    }

    service = { send: sinon.spy() }

    // Mock Game.getObjectById
    // @ts-ignore
    global.Game = {
      getObjectById: sinon.stub().returns(supplier)
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

  it('should send full event and return idle if creep is already full', () => {
    context.energy = 50
    context.capacity = 50
    const result = collectEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send idle event and return idle if supplier not found', () => {
    // @ts-ignore
    Game.getObjectById.returns(null)
    const result = collectEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should move creep to supplier if not in range', () => {
    creep.pos.isNearTo.returns(false)

    const result = collectEnergyByReservation({ creep, context, service })
    
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should withdraw energy from structure supplier when in range', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(OK)
    supplier.store.getUsedCapacity.returns(100) // Supplier has energy
    creep.store.getFreeCapacity.returns(40) // Creep has space

    const result = collectEnergyByReservation({ creep, context, service })

    expect(creep.withdraw.calledWith(supplier, RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should send full event if creep becomes full after withdrawal', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(OK)
    creep.store.energy = 50
    creep.store.getCapacity.returns(50)
    supplier.store.getUsedCapacity.returns(100)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should handle spawn renewal when withdrawing from spawn', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(OK)
    creep.ticksToLive = 1000
    supplier.spawning = null
    supplier.renewCreep = sinon.spy()
    supplier.structureType = STRUCTURE_SPAWN

    collectEnergyByReservation({ creep, context, service })

    expect(supplier.renewCreep.calledWith(creep)).to.be.true
  })

  it('should handle creep-to-creep energy transfer', () => {
    creep.pos.isNearTo.returns(true)
    supplier.transfer = sinon.stub().returns(OK)
    supplier.store.getUsedCapacity.returns(50)
    
    // Make supplier a creep by removing structure properties
    delete supplier.store
    delete supplier.structureType

    const result = collectEnergyByReservation({ creep, context, service })

    expect(supplier.transfer.calledWith(creep, RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should send idle if supplier has no energy', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(ERR_NOT_ENOUGH_RESOURCES)
    supplier.store.getUsedCapacity.returns(0)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send full event if creep is already full', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(ERR_FULL)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should continue collecting on other errors', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(-1) // Some other error

    const result = collectEnergyByReservation({ creep, context, service })

    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should respect amount reserved when calculating withdrawal amount', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(OK)
    context.amountReserved = 15 // Less than free capacity
    creep.store.getFreeCapacity.returns(40)
    supplier.store.getUsedCapacity.returns(100)

    collectEnergyByReservation({ creep, context, service })

    expect(creep.withdraw.calledWith(supplier, RESOURCE_ENERGY, 15)).to.be.true
  })

  it('should handle creep-to-creep energy transfer', () => {
    creep.pos.isNearTo.returns(true)
    supplier.transfer = sinon.stub().returns(OK)
    supplier.store.getUsedCapacity.returns(50)
    
    // Make supplier a creep by removing structure properties
    delete supplier.store
    delete supplier.structureType

    const result = collectEnergyByReservation({ creep, context, service })

    expect(supplier.transfer.calledWith(creep, RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should send idle if supplier has no energy', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw.returns(ERR_NOT_ENOUGH_RESOURCES)
    supplier.store.getUsedCapacity.returns(0)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send full event if creep is already full', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw.returns(ERR_FULL)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should continue collecting on other errors', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw.returns(-1) // Some other error

    const result = collectEnergyByReservation({ creep, context, service })

    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should respect amount reserved when calculating withdrawal amount', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw.returns(OK)
    context.amountReserved = 15 // Less than free capacity
    creep.store.getFreeCapacity.returns(40)
    supplier.store.getUsedCapacity.returns(100)

    collectEnergyByReservation({ creep, context, service })

    expect(creep.withdraw.calledWith(supplier, RESOURCE_ENERGY, 15)).to.be.true
  })
})
