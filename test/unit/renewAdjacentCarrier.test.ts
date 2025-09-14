import { renewAdjacentCarrier } from 'behaviours/renewAdjacentCarrier'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { Carrier } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('renewAdjacentCarrier', () => {
  let creep: any
  let spawn: any
  let carrierMemory: Carrier
  let originalGameTime: number

  beforeEach(() => {
    setupGlobals()
    
    // Mock Game.time
    originalGameTime = (global as any).Game?.time
    ;(global as any).Game = {
      ...(global as any).Game,
      time: 12345
    }

    spawn = {
      id: 'spawn1',
      spawning: null,
      renewCreep: sinon.stub()
    }

    creep = {
      name: 'TestCarrier',
      ticksToLive: 1000
    }

    carrierMemory = {
      decayTiming: {
        earliestTick: 12300, // Before current time
        threshold: 100,
        latestTick: 13000
      }
    } as Carrier

    // @ts-ignore
    global.OK = 0
    // @ts-ignore
    global.CREEP_LIFE_TIME = 1500
  })

  afterEach(() => {
    if (originalGameTime !== undefined) {
      ;(global as any).Game.time = originalGameTime
    }
  })

  it('should return early if carrier does not need renewal', () => {
    carrierMemory.decayTiming.earliestTick = 15000 // Future time
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.notCalled).to.be.true
  })

  it('should return early if spawn does not exist', () => {
    renewAdjacentCarrier({ carrierMemory, creep, spawn: null as any })

    expect(spawn.renewCreep.notCalled).to.be.true
  })

  it('should return early if spawn is spawning', () => {
    spawn.spawning = { 
      name: 'SomeCreep',
      needTime: 5,
      remainingTime: 3
    }
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.notCalled).to.be.true
  })

  it('should successfully renew carrier and update memory when conditions are met', () => {
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    
    // Verify memory updates
    const expectedEarliestTick = 12345 + 1500 - 1000 + 100 // gameTime + CREEP_LIFE_TIME - ticksToLive + threshold
    const expectedLatestTick = 12345 + 1000 // gameTime + ticksToLive
    
    expect(carrierMemory.decayTiming.earliestTick).to.equal(expectedEarliestTick)
    expect(carrierMemory.decayTiming.latestTick).to.equal(expectedLatestTick)
  })

  it('should handle renewal failure and log error', () => {
    const consoleSpy = sinon.spy(console, 'log')
    spawn.renewCreep.returns(-1) // Some error code
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    expect(consoleSpy.calledWith(`Failed to renew carrier ${creep.name} at spawn ${spawn.id}: -1`)).to.be.true
    
    // Memory should not be updated on failure
    expect(carrierMemory.decayTiming.earliestTick).to.equal(12300) // Original value
    
    consoleSpy.restore()
  })

  it('should handle creep with undefined ticksToLive', () => {
    creep.ticksToLive = undefined
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    
    // Verify memory updates with 0 ticksToLive
    const expectedEarliestTick = 12345 + 1500 - 0 + 100 // gameTime + CREEP_LIFE_TIME - 0 + threshold
    const expectedLatestTick = 12345 + 0 // gameTime + 0
    
    expect(carrierMemory.decayTiming.earliestTick).to.equal(expectedEarliestTick)
    expect(carrierMemory.decayTiming.latestTick).to.equal(expectedLatestTick)
  })

  it('should handle creep with null ticksToLive', () => {
    creep.ticksToLive = null
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    
    // Verify memory updates with 0 ticksToLive (null coerced to 0)
    const expectedEarliestTick = 12345 + 1500 - 0 + 100
    const expectedLatestTick = 12345 + 0
    
    expect(carrierMemory.decayTiming.earliestTick).to.equal(expectedEarliestTick)
    expect(carrierMemory.decayTiming.latestTick).to.equal(expectedLatestTick)
  })

  it('should handle edge case where carrier exactly needs renewal', () => {
    carrierMemory.decayTiming.earliestTick = 12345 // Exactly current time
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    // Since gameTime > earliestTick is 12345 > 12345 = false, should not renew
    expect(spawn.renewCreep.notCalled).to.be.true
  })

  it('should handle edge case where carrier barely needs renewal', () => {
    carrierMemory.decayTiming.earliestTick = 12344 // One tick before current time
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    
    const expectedEarliestTick = 12345 + 1500 - 1000 + 100
    const expectedLatestTick = 12345 + 1000
    
    expect(carrierMemory.decayTiming.earliestTick).to.equal(expectedEarliestTick)
    expect(carrierMemory.decayTiming.latestTick).to.equal(expectedLatestTick)
  })

  it('should handle different threshold values correctly', () => {
    carrierMemory.decayTiming.threshold = 50 // Different threshold
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    
    const expectedEarliestTick = 12345 + 1500 - 1000 + 50 // Using new threshold
    const expectedLatestTick = 12345 + 1000
    
    expect(carrierMemory.decayTiming.earliestTick).to.equal(expectedEarliestTick)
    expect(carrierMemory.decayTiming.latestTick).to.equal(expectedLatestTick)
  })

  it('should handle creep with very low ticksToLive', () => {
    creep.ticksToLive = 10 // Very low
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    
    const expectedEarliestTick = 12345 + 1500 - 10 + 100
    const expectedLatestTick = 12345 + 10
    
    expect(carrierMemory.decayTiming.earliestTick).to.equal(expectedEarliestTick)
    expect(carrierMemory.decayTiming.latestTick).to.equal(expectedLatestTick)
  })

  it('should handle creep with very high ticksToLive', () => {
    creep.ticksToLive = 1490 // Very high (near max)
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
    
    const expectedEarliestTick = 12345 + 1500 - 1490 + 100
    const expectedLatestTick = 12345 + 1490
    
    expect(carrierMemory.decayTiming.earliestTick).to.equal(expectedEarliestTick)
    expect(carrierMemory.decayTiming.latestTick).to.equal(expectedLatestTick)
  })

  it('should handle different spawn conditions properly', () => {
    // Test with spawning = false (explicit false rather than null/undefined)
    spawn.spawning = false
    spawn.renewCreep.returns(0) // OK
    
    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    expect(spawn.renewCreep.calledWith(creep)).to.be.true
  })

  it('should not modify original memory object references', () => {
    const originalDecayTiming = { ...carrierMemory.decayTiming }
    spawn.renewCreep.returns(0) // OK

    renewAdjacentCarrier({ carrierMemory, creep, spawn })

    // The object reference should be the same, but values should be updated
    expect(carrierMemory.decayTiming).to.not.deep.equal(originalDecayTiming)
    expect(carrierMemory.decayTiming.threshold).to.equal(originalDecayTiming.threshold) // Threshold should remain unchanged
  })
})
