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
  let carrier: any

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
      pickup: sinon.stub(),
      moveByPath: sinon.stub(),
      ticksToLive: 1000
    }

    carrier = {
      reservation: {
        action: 'withdraw',
        amount: 30,
        arrivalTick: 100,
        path: [{ x: 10, y: 20, roomName: 'W1N1' }],
        targetId: 'supplier123',
        type: 'collectEnergy'
      },
      energy: {
        capacity: 50
      },
      decayTiming: {
        earliestTick: 2000,
        interval: 1,
        latestTick: 3000,
        threshold: 100
      }
    }

    context = {
      energy: 10,
      capacity: 50,
      carrierId: 'testCarrier'
    }

    service = { send: sinon.spy() }

    // Mock Memory structure
    // @ts-ignore
    global.Memory = {
      energyLogistics: {
        carriers: {
          testCarrier: carrier
        },
        stores: {
          supplier123: { reservations: {} }
        }
      }
    }

    // Mock Game.rooms
    global.Game = {
      rooms: {
        // @ts-ignore
        W1N1: {
          lookForAt: sinon.stub().returns([supplier])
        }
      },
      time: 1500
    }

    // @ts-ignore
    global.LOOK_STRUCTURES = 'structures'

    // @ts-ignore
    global.RESOURCE_ENERGY = 'energy'
    // @ts-ignore
    global.CREEP_LIFE_TIME = 1500
    // @ts-ignore
    global.STRUCTURE_SPAWN = 'spawn'
    // @ts-ignore
    global.FIND_DROPPED_RESOURCES = 'droppedResources'
    // @ts-ignore
    global.ERR_NOT_FOUND = -5
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

  it('should send idle event and return idle if no reservation found', () => {
    // @ts-ignore
    Memory.energyLogistics.carriers.testCarrier = undefined
    const result = collectEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send idle event and return idle if reservation type is invalid', () => {
    carrier.reservation.type = 'deliverEnergy'
    const result = collectEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send idle event and return idle if supplier not found', () => {
    // @ts-ignore
    Game.rooms.W1N1.lookForAt.returns([]) // No structures found
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
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should send full event if creep becomes full after withdrawal', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(OK)
    creep.store.getUsedCapacity.returns(50) // Creep is now full
    supplier.store.getUsedCapacity.returns(100)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should handle spawn renewal when withdrawing from spawn', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(OK)
    creep.ticksToLive = 1000
    supplier.spawning = null
    supplier.structureType = STRUCTURE_SPAWN

    collectEnergyByReservation({ creep, context, service })

    // Note: The renewAdjacentCarrier function is called with the spawn
    // We can't easily test its internal behavior without mocking the import
    expect(creep.withdraw.calledWith(supplier, RESOURCE_ENERGY, 30)).to.be.true
  })

  it('should handle creep-to-creep energy transfer', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(OK) // Creep withdraws from another creep
    supplier.store = undefined // Creeps don't have store property like structures
    
    const result = collectEnergyByReservation({ creep, context, service })

    expect(creep.withdraw.calledWith(supplier, RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should send idle if supplier has no energy', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(ERR_NOT_ENOUGH_RESOURCES)
    supplier.store.getUsedCapacity.returns(0)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should send full event if creep is already full', () => {
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.stub().returns(ERR_FULL)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
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
    carrier.reservation.amount = 15 // Change the reservation amount
    creep.store.getFreeCapacity.returns(40)
    supplier.store.getUsedCapacity.returns(100)

    collectEnergyByReservation({ creep, context, service })

    expect(creep.withdraw.calledWith(supplier, RESOURCE_ENERGY, 15)).to.be.true
  })

  it('should handle pickup action for dropped resources', () => {
    creep.pos.isNearTo.returns(true)
    carrier.reservation.action = 'pickup'
    const droppedResource = { resourceType: 'energy' }
    supplier.pos = {
      findInRange: sinon.stub().returns([droppedResource])
    }
    creep.pickup = sinon.stub().returns(OK)

    const result = collectEnergyByReservation({ creep, context, service })

    expect(creep.pickup.calledWith(droppedResource)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

})
