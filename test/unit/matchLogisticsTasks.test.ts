import { expect } from 'chai'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'

import { matchLogisticsTasks } from '../../src/logistics/matchLogisticsTasks'
import { Carrier, Store, Urgency, CreepRole } from '../../src/types'

describe('matchLogisticsTasks', () => {
  let pathFinderStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()

    pathFinderStub = sinon.stub()
    // @ts-ignore
    global.PathFinder = { search: pathFinderStub }
  })

  afterEach(() => {
    sinon.restore()
  })

  const createMockCarrier = (x: number, y: number, roomName: string = 'W1N1'): Carrier => ({
    energy: {
      current: 0,
      capacity: 50
    },
    name: `Carrier_${x},${y}`,
    pos: { x, y },
    roomName,
    urgency: {
      peace: Urgency.HIGH,
      war: Urgency.HIGH
    },
    decayTiming: {
      earliestTick: 200,
      interval: 1,
      latestTick: 300,
      threshold: 0
    },
    type: CreepRole.HAULER
  })

  const createMockStore = (x: number, y: number, roomName: string = 'W1N1'): Store => ({
    actions: { collect: 'withdraw', deliver: 'transfer' },
    energy: {
      current: 1000,
      capacity: 2000
    },
    name: `Store_${x},${y}`,
    pos: { x, y },
    reservations: {},
    roomName,
    urgency: {
      peace: Urgency.MEDIUM,
      war: Urgency.LOW
    },
    type: 'container-source'
  })

  it('should return all destinations as remaining when no carriers provided', () => {
    const destinations: Store[] = [createMockStore(10, 10)]
    const result = matchLogisticsTasks({ carriers: [], destinations })

    expect(result).to.be.an('object')
    expect(result.remainingCarriers).to.be.an('array').that.is.empty
    expect(result.remainingDestinations).to.have.length(1)
    expect(result.remainingDestinations[0]).to.equal(destinations[0])
  })

  it('should return all carriers as remaining when no destinations provided', () => {
    const carriers: Carrier[] = [createMockCarrier(5, 5)]
    const result = matchLogisticsTasks({ carriers, destinations: [] })
    
    expect(result).to.be.an('object')
    expect(result.remainingCarriers).to.have.length(1)
    expect(result.remainingCarriers[0]).to.equal(carriers[0])
    expect(result.remainingDestinations).to.be.an('array').that.is.empty
  })

  it('should return all carriers and destinations as remaining when PathFinder returns incomplete paths', () => {
    pathFinderStub.returns({ path: [], ops: 1000, cost: 0, incomplete: true })
    
    const carriers: Carrier[] = [createMockCarrier(5, 5)]
    const destinations: Store[] = [createMockStore(10, 10)]
    
    const result = matchLogisticsTasks({ carriers, destinations })
    
    expect(result.remainingCarriers).to.have.length(1)
    expect(result.remainingCarriers[0]).to.equal(carriers[0])
    expect(result.remainingDestinations).to.have.length(1)
    expect(result.remainingDestinations[0]).to.equal(destinations[0])
    expect(pathFinderStub.calledOnce).to.be.true
  })

  it('should return all carriers and destinations as remaining when PathFinder returns empty paths', () => {
    pathFinderStub.returns({ path: [], ops: 500, cost: 0, incomplete: false })
    
    const carriers: Carrier[] = [createMockCarrier(5, 5)]
    const destinations: Store[] = [createMockStore(10, 10)]
    
    const result = matchLogisticsTasks({ carriers, destinations })
    
    expect(result.remainingCarriers).to.have.length(1)
    expect(result.remainingCarriers[0]).to.equal(carriers[0])
    expect(result.remainingDestinations).to.have.length(1)
    expect(result.remainingDestinations[0]).to.equal(destinations[0])
    expect(pathFinderStub.calledOnce).to.be.true
  })

  it('should match single carrier to single destination leaving both lists empty', () => {
    const mockPath = [
      { x: 5, y: 5, roomName: 'W1N1' },
      { x: 6, y: 6, roomName: 'W1N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    pathFinderStub.returns({ path: mockPath, ops: 500, cost: 10, incomplete: false })
    
    const carriers: Carrier[] = [createMockCarrier(5, 5)]
    const destinations: Store[] = [createMockStore(10, 10)]
    
    const result = matchLogisticsTasks({ carriers, destinations })
    
    expect(result.remainingCarriers).to.be.empty
    expect(result.remainingDestinations).to.be.empty
    expect(pathFinderStub.calledOnce).to.be.true
  })

  it('should match multiple carriers to multiple destinations leaving both lists empty', () => {
    const mockPath1 = [
      { x: 5, y: 5, roomName: 'W1N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    const mockPath2 = [
      { x: 15, y: 15, roomName: 'W1N1' },
      { x: 20, y: 20, roomName: 'W1N1' }
    ]
    
    pathFinderStub.onFirstCall().returns({ path: mockPath1, ops: 500, cost: 5, incomplete: false })
    pathFinderStub.onSecondCall().returns({ path: mockPath2, ops: 500, cost: 7, incomplete: false })
    
    const carriers: Carrier[] = [
      createMockCarrier(5, 5),
      createMockCarrier(15, 15)
    ]
    const destinations: Store[] = [
      createMockStore(10, 10),
      createMockStore(20, 20)
    ]
    
    const result = matchLogisticsTasks({ carriers, destinations })
    
    expect(result.remainingCarriers).to.be.empty
    expect(result.remainingDestinations).to.be.empty
  })

  it('should leave extra carriers as remaining when there are more carriers than destinations', () => {
    // Store at (10, 10)
    // Carrier 1 at (5, 5) - distance 2 to store
    // Carrier 2 at (15, 15) - distance 2 to store
    // Carrier 3 at (25, 25) - distance 2 to store
    
    const mockPath1 = [
      { x: 5, y: 5, roomName: 'W1N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    const mockPath2 = [
      { x: 15, y: 15, roomName: 'W1N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    const mockPath3 = [
      { x: 25, y: 25, roomName: 'W1N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    
    pathFinderStub.onCall(0).returns({ path: mockPath1, ops: 500, cost: 5, incomplete: false })
    pathFinderStub.onCall(1).returns({ path: mockPath2, ops: 500, cost: 7, incomplete: false })
    pathFinderStub.onCall(2).returns({ path: mockPath3, ops: 500, cost: 15, incomplete: false })
    
    const carriers: Carrier[] = [
      createMockCarrier(5, 5),
      createMockCarrier(15, 15),
      createMockCarrier(25, 25)
    ]
    const destinations: Store[] = [
      createMockStore(10, 10)
    ]
    
    const result = matchLogisticsTasks({ carriers, destinations })
    
    expect(result.remainingCarriers).to.have.length(2) // Two carriers should remain unmatched
    expect(result.remainingDestinations).to.be.empty // Store should be matched
    
    // The closest carrier (carrier 1) should be assigned, so carriers 2 and 3 should remain
    const remainingCarrierNames = result.remainingCarriers.map(c => c.name)
    expect(remainingCarrierNames).to.include.members(['Carrier_15,15', 'Carrier_25,25'])
  })

  it('should prefer same room carrier over different room carrier', () => {
    const mockPath1 = [
      { x: 5, y: 5, roomName: 'W1N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    const mockPath2 = [
      { x: 15, y: 15, roomName: 'W2N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    
    pathFinderStub.onFirstCall().returns({ path: mockPath1, ops: 500, cost: 5, incomplete: false })
    pathFinderStub.onSecondCall().returns({ path: mockPath2, ops: 500, cost: 50, incomplete: false })
    
    const carriers: Carrier[] = [
      createMockCarrier(5, 5, 'W1N1'),
      createMockCarrier(15, 15, 'W2N1')
    ]
    const destinations: Store[] = [
      createMockStore(10, 10, 'W1N1')
    ]
    
    const result = matchLogisticsTasks({ carriers, destinations })
    
    expect(result.remainingCarriers).to.have.length(1) // One carrier should remain unmatched
    expect(result.remainingDestinations).to.be.empty // Store should be matched
    expect(result.remainingCarriers[0]).to.equal(carriers[1]) // Cross-room carrier should remain
  })

  it('should call PathFinder with correct parameters', () => {
    const mockPath = [
      { x: 5, y: 5, roomName: 'W1N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    pathFinderStub.returns({ path: mockPath, ops: 500, cost: 5, incomplete: false })
    
    const carriers: Carrier[] = [createMockCarrier(5, 5)]
    const destinations: Store[] = [createMockStore(10, 10)]
    
    matchLogisticsTasks({ carriers, destinations })
    
    expect(pathFinderStub.calledOnce).to.be.true
    const args = pathFinderStub.getCall(0).args
    
    // Check origin
    expect(args[0]).to.be.instanceOf((global as any).RoomPosition)
    expect(args[0].x).to.equal(5)
    expect(args[0].y).to.equal(5)
    expect(args[0].roomName).to.equal('W1N1')
    
    // Check goals
    expect(args[1]).to.be.an('array')
    expect(args[1]).to.have.length(1)
    expect(args[1][0].pos).to.be.instanceOf((global as any).RoomPosition)
    expect(args[1][0].pos.x).to.equal(10)
    expect(args[1][0].pos.y).to.equal(10)
    expect(args[1][0].pos.roomName).to.equal('W1N1')
    expect(args[1][0].range).to.equal(1)
    
    // Check options
    expect(args[2]).to.deep.include({
      plainCost: 2,
      swampCost: 10,
      maxOps: 2000
    })
  })

  it('should stop when no new matches are found in iteration', () => {
    // This tests the break condition in the while loop
    pathFinderStub.returns({ path: [], ops: 500, cost: 0, incomplete: true })
    
    const carriers: Carrier[] = [
      createMockCarrier(5, 5),
      createMockCarrier(15, 15)
    ]
    const destinations: Store[] = [
      createMockStore(10, 10),
      createMockStore(20, 20)
    ]
    
    const result = matchLogisticsTasks({ carriers, destinations })
    
    expect(result.remainingCarriers).to.have.length(2)
    expect(result.remainingDestinations).to.have.length(2)
    // Should only call PathFinder twice (once per carrier) before breaking
    expect(pathFinderStub.callCount).to.equal(2)
  })

  it('should handle complex matching scenario with distance preferences', () => {
    // Carrier 1 can reach Store 1 (distance 2) and Store 2 (distance 10)
    // Carrier 2 can reach Store 1 (distance 8) and Store 2 (distance 3)
    // Expected: Carrier 1 -> Store 1, Carrier 2 -> Store 2
    
    const pathsForCarrier1 = [
      [{ x: 5, y: 5, roomName: 'W1N1' }, { x: 10, y: 10, roomName: 'W1N1' }], // to store 1, cost 2
      [{ x: 5, y: 5, roomName: 'W1N1' }, { x: 20, y: 20, roomName: 'W1N1' }] // to store 2, cost 10
    ]
    const pathsForCarrier2 = [
      [{ x: 15, y: 15, roomName: 'W1N1' }, { x: 10, y: 10, roomName: 'W1N1' }], // to store 1, cost 8  
      [{ x: 15, y: 15, roomName: 'W1N1' }, { x: 20, y: 20, roomName: 'W1N1' }] // to store 2, cost 3
    ]
    
    pathFinderStub.onCall(0).returns({ path: pathsForCarrier1[0], ops: 500, cost: 2, incomplete: false })
    pathFinderStub.onCall(1).returns({ path: pathsForCarrier2[0], ops: 500, cost: 8, incomplete: false })
    pathFinderStub.onCall(2).returns({ path: pathsForCarrier2[1], ops: 500, cost: 3, incomplete: false })
    
    const carriers: Carrier[] = [
      createMockCarrier(5, 5),
      createMockCarrier(15, 15)
    ]
    const destinations: Store[] = [
      createMockStore(10, 10),
      createMockStore(20, 20)
    ]
    
    const result = matchLogisticsTasks({ carriers, destinations })
    
    expect(result.remainingCarriers).to.be.empty
    expect(result.remainingDestinations).to.be.empty
    
    // Both carriers and destinations should be matched, leaving nothing remaining
    // The algorithm should optimize for closest matches
  })
})
