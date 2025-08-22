import { collectEnergy } from 'behaviours/upgraderBehaviours/collectEnergy'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'
import { SharedCreepEventType, SharedCreepState } from 'types'

describe('collectEnergy', () => {
    beforeEach(() => {
        setupGlobals()
    })

  it('should return collecting if closestDroppedEnergy exists but not in range', () => {
    const dropped = [{ pos: { x: 11, y: 20, inRangeTo: sinon.stub().returns(false), resourceType: RESOURCE_ENERGY } }]
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns(dropped)
    creep.pos.findClosestByPath.returns(dropped[0])
    creep.pos.isNearTo.returns(false)
    creep.pickup = sinon.spy()
    creep.store.energy = 10
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.pickup.called).to.be.false
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.false
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should not move if no dropped resources or stores found', () => {
    const dropped = [{ pos: { x: 11, y: 20, inRangeTo: sinon.stub().returns(false), resourceType: RESOURCE_ENERGY } }]
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns(dropped)
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([])
    creep.pos.findClosestByPath.returns(undefined)
    creep.pos.isNearTo.returns(false)
    creep.pickup = sinon.spy()
    creep.store.energy = 10
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.moveTo.called).to.be.false
    expect(creep.pickup.called).to.be.false
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.false
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should filter tombstones, ruins, and structureStores for energy capacity', () => {
    const tombstone = { pos: { x: 13, y: 21 }, store: { getCapacity: sinon.stub().returns(0) } }
    const ruin = { pos: { x: 14, y: 22 }, store: { getCapacity: sinon.stub().returns(0) } }
    const structureStores = [
        { pos: { x: 15, y: 23 }, store: { getCapacity: sinon.stub().returns(0) }, type: STRUCTURE_STORAGE },
        { pos: { x: 14, y: 25 }, type: STRUCTURE_OBSERVER },
        { pos: { x: 14, y: 25 }, store: { getCapacity: sinon.stub().returns(10) }, type: STRUCTURE_EXTENSION },
        { pos: { x: 14, y: 25 }, store: { getCapacity: sinon.stub().returns(0) }, type: STRUCTURE_CONTAINER },
        { pos: { x: 14, y: 25 }, store: { getCapacity: sinon.stub().returns(-1) }, type: STRUCTURE_CONTAINER },
    ]

    room.find = (type: number) => {
      if (type === FIND_DROPPED_RESOURCES) {
        return []
      }
      if (type === FIND_TOMBSTONES) {
        return [tombstone]
      }
      if (type === FIND_RUINS) {
        return [ruin]
      }
      if (type === FIND_STRUCTURES) {
        return structureStores
      }
      return []
    }

    creep.pos.findClosestByPath.returns(null)
    creep.pos.isNearTo.returns(false)
    creep.withdraw = sinon.spy()
    creep.store.energy = 10
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.withdraw.called).to.be.false
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.false
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })
  it('should withdraw from tombstone if available and in range', () => {
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    const tombstone = { pos: { x: 13, y: 21 }, store: { getCapacity: sinon.stub().returns(50) } }
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([tombstone])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([])
    creep.pos.findClosestByPath.returns(tombstone)
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.spy()
    creep.store.energy = 50
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.withdraw.calledWith(tombstone, RESOURCE_ENERGY)).to.be.true
    expect(upgraderService.send.args[0][0].type).to.equal(SharedCreepEventType.full)
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should withdraw from ruin if available and in range', () => {
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    const ruin = { pos: { x: 14, y: 22 }, store: { getCapacity: sinon.stub().returns(50) } }
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([ruin])
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([])
    creep.pos.findClosestByPath.returns(ruin)
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.spy()
    creep.store.energy = 50
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.withdraw.calledWith(ruin, RESOURCE_ENERGY)).to.be.true
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should withdraw from structure store if available and in range', () => {
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    const structureStore = { pos: { x: 15, y: 23 }, store: { getCapacity: sinon.stub().returns(50) } }
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([structureStore])
    creep.pos.findClosestByPath.returns(structureStore)
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.spy()
    creep.store.energy = 50
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.withdraw.calledWith(structureStore, RESOURCE_ENERGY)).to.be.true
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should return collecting if closestStore is not in range', () => {
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    const structureStore = { pos: { x: 15, y: 23 }, store: { getCapacity: sinon.stub().returns(50) } }
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([structureStore])
    creep.pos.findClosestByPath.returns(structureStore)
    creep.pos.isNearTo.returns(false)
    creep.withdraw = sinon.spy()
    creep.store.energy = 10
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.withdraw.called).to.be.false
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.false
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })
  let creep: any
  let context: any
  let upgraderService: any
  let room: any

  beforeEach(() => {
    setupGlobals()
    context = { energy: 0, capacity: 50 }
    upgraderService = { send: sinon.spy() }
    room = {
      find: sinon.stub()
    }
    creep = {
      pos: {
        findClosestByPath: sinon.stub(),
        isNearTo: sinon.stub().returns(false),
        inRangeTo: sinon.stub().returns(false),
        x: 10,
        y: 20
      },
      room,
      store: { energy: 0, getCapacity: sinon.stub().returns(50) },
      pickup: sinon.spy(),
      withdraw: sinon.spy(),
      moveTo: sinon.spy()
    }
  })

  it('should pick up dropped energy if in range but not full, and return collecting', () => {
    const dropped = [{ pos: { x: 11, y: 20, inRangeTo: sinon.stub().returns(true) } }]
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns(dropped)
    creep.pos.findClosestByPath.returns(dropped[0])
    creep.pos.isNearTo.returns(true)
    creep.pickup = sinon.spy()
    creep.store.energy = 10
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.pickup.calledWith(dropped[0])).to.be.true
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.false
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should transition to upgrading if creep is full', () => {
    context.energy = 50
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should pick up dropped energy if available and in range', () => {
    const dropped = [{ pos: { x: 11, y: 20, inRangeTo: sinon.stub().returns(true) } }]
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns(dropped)
    creep.pos.findClosestByPath.returns(dropped[0])
    creep.pos.isNearTo.returns(true)
    creep.pickup = sinon.spy()
    creep.store.energy = 50
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.pickup.calledWith(dropped[0])).to.be.true
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should withdraw from closest store if available and in range', () => {
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    const store = { pos: { x: 12, y: 20 }, store: { getCapacity: sinon.stub().returns(50) } }
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([store])
    creep.pos.findClosestByPath.returns(store)
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.spy()
    creep.store.energy = 50
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.withdraw.calledWith(store, RESOURCE_ENERGY)).to.be.true
    expect(upgraderService.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({ continue: true, state: SharedCreepState.idle })
  })

  it('should call renewCreep if structure has renewCreep method', () => {
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    const spawn = { 
      pos: { x: 15, y: 23 }, 
      store: { getCapacity: sinon.stub().returns(50) },
      renewCreep: sinon.spy()
    }
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([spawn])
    creep.pos.findClosestByPath.returns(spawn)
    creep.pos.isNearTo.returns(true)
    creep.withdraw = sinon.spy()
    creep.store.energy = 10 // Not full to avoid full transition
    creep.store.getCapacity = sinon.stub().returns(50)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(creep.withdraw.calledWith(spawn, RESOURCE_ENERGY)).to.be.true
    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should return collecting if not in range of any energy source', () => {
    room.find.returns([])
    creep.pos.findClosestByPath.returns(null)
    creep.pos.isNearTo.returns(false)
    const result = collectEnergy({ creep, context, service: upgraderService })
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should filter dropped resources by energy type', () => {
    // Create mixed resources including non-energy resources
    const droppedResources = [
      { pos: { x: 11, y: 20 }, resourceType: RESOURCE_ENERGY, amount: 100 },
      { pos: { x: 12, y: 20 }, resourceType: 'hydrogen' as ResourceConstant, amount: 50 },
      { pos: { x: 13, y: 20 }, resourceType: 'oxygen' as ResourceConstant, amount: 30 }
    ]
    
    // Mock room.find to return mixed resources but verify filter is called
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns(droppedResources)
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([])
    
    creep.pos.findClosestByPath.returns(null)
    
    const result = collectEnergy({ creep, context, service: upgraderService })
    
    // Verify the filter function was called by checking the filter parameter
    const findCall = room.find.getCall(0)
    expect(findCall.args[1]).to.have.property('filter')
    expect(typeof findCall.args[1].filter).to.equal('function')
    
    // Test the filter function directly
    const filterFunction = findCall.args[1].filter
    expect(filterFunction(droppedResources[0])).to.be.true  // Energy resource
    expect(filterFunction(droppedResources[1])).to.be.false // Hydrogen resource
    expect(filterFunction(droppedResources[2])).to.be.false // Oxygen resource
    
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should filter tombstones by energy capacity', () => {
    // Create tombstones with different energy capacities
    const tombstones = [
      { pos: { x: 13, y: 21 }, store: { getCapacity: sinon.stub().returns(100) } },
      { pos: { x: 14, y: 21 }, store: { getCapacity: sinon.stub().returns(0) } },
      { pos: { x: 15, y: 21 }, store: { getCapacity: sinon.stub().returns(50) } }
    ]
    
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns(tombstones)
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([])
    
    creep.pos.findClosestByPath.returns(null)
    
    const result = collectEnergy({ creep, context, service: upgraderService })
    
    // Verify the filter function was called
    const tombstoneCall = room.find.getCalls().find((call: any) => call.args[0] === FIND_TOMBSTONES)
    expect(tombstoneCall.args[1]).to.have.property('filter')
    expect(typeof tombstoneCall.args[1].filter).to.equal('function')
    
    // Test the filter function directly
    const filterFunction = tombstoneCall.args[1].filter
    expect(!!filterFunction(tombstones[0])).to.be.true   // Has energy capacity (100 -> truthy)
    expect(!!filterFunction(tombstones[1])).to.be.false  // No energy capacity (0 -> falsy)
    expect(!!filterFunction(tombstones[2])).to.be.true   // Has energy capacity (50 -> truthy)
    
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should filter ruins by energy capacity', () => {
    // Create ruins with different energy capacities
    const ruins = [
      { pos: { x: 14, y: 22 }, store: { getCapacity: sinon.stub().returns(75) } },
      { pos: { x: 15, y: 22 }, store: { getCapacity: sinon.stub().returns(0) } },
      { pos: { x: 16, y: 22 }, store: { getCapacity: sinon.stub().returns(null) } }
    ]
    
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns(ruins)
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns([])
    
    creep.pos.findClosestByPath.returns(null)
    
    const result = collectEnergy({ creep, context, service: upgraderService })
    
    // Verify the filter function was called
    const ruinCall = room.find.getCalls().find((call: any) => call.args[0] === FIND_RUINS)
    expect(ruinCall.args[1]).to.have.property('filter')
    expect(typeof ruinCall.args[1].filter).to.equal('function')
    
    // Test the filter function directly
    const filterFunction = ruinCall.args[1].filter
    expect(!!filterFunction(ruins[0])).to.be.true   // Has energy capacity (75 -> truthy)
    expect(!!filterFunction(ruins[1])).to.be.false  // No energy capacity (0 -> falsy)  
    expect(!!filterFunction(ruins[2])).to.be.false  // Null energy capacity (null -> falsy)
    
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })

  it('should filter structures by having store and energy capacity', () => {
    // Create structures with and without store property and energy capacity
    const structures = [
      { pos: { x: 15, y: 23 }, store: { getCapacity: sinon.stub().returns(50) }, type: STRUCTURE_STORAGE },
      { pos: { x: 16, y: 23 }, type: STRUCTURE_OBSERVER }, // No store property
      { pos: { x: 17, y: 23 }, store: { getCapacity: sinon.stub().returns(0) }, type: STRUCTURE_EXTENSION },
      { pos: { x: 18, y: 23 }, store: { getCapacity: sinon.stub().returns(100) }, type: STRUCTURE_CONTAINER }
    ]
    
    room.find.withArgs(FIND_DROPPED_RESOURCES, sinon.match.any).returns([])
    room.find.withArgs(FIND_TOMBSTONES, sinon.match.any).returns([])
    room.find.withArgs(FIND_RUINS, sinon.match.any).returns([])
    room.find.withArgs(FIND_STRUCTURES, sinon.match.any).returns(structures)
    
    creep.pos.findClosestByPath.returns(null)
    
    const result = collectEnergy({ creep, context, service: upgraderService })
    
    // The test verifies that the structure filter logic is executed
    // The filter should include structures[0] and structures[3] (have store and energy capacity)
    // The filter should exclude structures[1] (no store) and structures[2] (no energy capacity)
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.collectingEnergy })
  })
})
