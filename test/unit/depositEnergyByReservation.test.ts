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
  let carrier: any

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

    carrier = {
      reservation: {
        action: 'transfer',
        amount: 30,
        arrivalTick: 100,
        path: [{ x: 10, y: 20, roomName: 'W1N1' }],
        targetId: 'recipient123',
        type: 'deliverEnergy'
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
      energy: 40,
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
          recipient123: { reservations: {} }
        }
      }
    }

    // Mock Game.rooms
    global.Game = {
      rooms: {
        // @ts-ignore
        W1N1: {
          lookForAt: sinon.stub().returns([recipient])
        }
      }
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

  it('should send idle event and return idle if no reservation found', () => {
    // @ts-ignore
    Memory.energyLogistics.carriers.testCarrier = undefined
    const result = depositEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send idle event and return idle if reservation type is invalid', () => {
    carrier.reservation.type = 'collectEnergy'
    const result = depositEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should send idle event and return idle if recipient not found', () => {
    // @ts-ignore
    Game.rooms.W1N1.lookForAt.returns([]) // No structures found
    const result = depositEnergyByReservation({ creep, context, service })
    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should move creep to recipient if not in range', () => {
    creep.pos.inRangeTo.returns(false)
    creep.moveByPath = sinon.stub()

    const result = depositEnergyByReservation({ creep, context, service })
    
    expect(creep.moveByPath.calledWith(carrier.reservation.path)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })

  it('should transfer energy to structure recipient when in range', () => {
    creep.pos.inRangeTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)

    const result = depositEnergyByReservation({ creep, context, service })

    expect(creep.transfer.calledWith(recipient, RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should drop energy when reservation action is drop', () => {
    carrier.reservation.action = 'drop'
    creep.pos.inRangeTo.returns(true)
    creep.drop = sinon.stub().returns(OK)

    const result = depositEnergyByReservation({ creep, context, service })

    expect(creep.drop.calledWith(RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should send empty event if creep becomes empty after transfer', () => {
    creep.pos.inRangeTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)
    creep.store.getUsedCapacity.returns(0) // Creep is now empty

    const result = depositEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.empty })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should handle spawn renewal when transferring to spawn', () => {
    creep.pos.inRangeTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)
    creep.ticksToLive = 1000
    recipient.spawning = null
    recipient.structureType = STRUCTURE_SPAWN

    depositEnergyByReservation({ creep, context, service })

    // Note: The renewAdjacentCarrier function is called with the spawn
    // We can't easily test its internal behavior without mocking the import
    expect(creep.transfer.calledWith(recipient, RESOURCE_ENERGY, 30)).to.be.true
  })

  it('should handle creep-to-creep energy transfer', () => {
    creep.pos.inRangeTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)
    
    // Make recipient a creep by removing structure properties and adding creep properties
    delete recipient.store
    delete recipient.structureType
    recipient.transfer = sinon.stub() // Creeps have transfer method

    const result = depositEnergyByReservation({ creep, context, service })

    expect(creep.transfer.calledWith(recipient, RESOURCE_ENERGY, 30)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should send idle if recipient is full', () => {
    creep.pos.inRangeTo.returns(true)
    creep.transfer = sinon.stub().returns(ERR_FULL)

    const result = depositEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should send empty event if creep has no resources', () => {
    creep.pos.inRangeTo.returns(true)
    creep.transfer = sinon.stub().returns(ERR_NOT_ENOUGH_RESOURCES)

    const result = depositEnergyByReservation({ creep, context, service })

    expect(service.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
  })

  it('should continue depositing on other errors', () => {
    creep.pos.inRangeTo.returns(true)
    creep.transfer = sinon.stub().returns(-1) // Some other error

    const result = depositEnergyByReservation({ creep, context, service })

    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })

  it('should use the exact amount reserved for transfer', () => {
    creep.pos.inRangeTo.returns(true)
    creep.transfer = sinon.stub().returns(OK)
    carrier.reservation.amount = 25

    depositEnergyByReservation({ creep, context, service })

    expect(creep.transfer.calledWith(recipient, RESOURCE_ENERGY, 25)).to.be.true
  })

  it('should check drop range with distance 0 for drop action', () => {
    carrier.reservation.action = 'drop'
    creep.pos.inRangeTo.withArgs(recipient.pos, 0).returns(false)
    creep.moveByPath = sinon.stub()

    const result = depositEnergyByReservation({ creep, context, service })

    expect(creep.pos.inRangeTo.calledWith(recipient.pos, 0)).to.be.true
    expect(creep.moveByPath.calledWith(carrier.reservation.path)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })

  it('should check transfer range with distance 1 for transfer action', () => {
    carrier.reservation.action = 'transfer'
    creep.pos.inRangeTo.withArgs(recipient.pos, 1).returns(false)
    creep.moveByPath = sinon.stub()

    const result = depositEnergyByReservation({ creep, context, service })

    expect(creep.pos.inRangeTo.calledWith(recipient.pos, 1)).to.be.true
    expect(creep.moveByPath.calledWith(carrier.reservation.path)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.depositingEnergy })
  })
})
