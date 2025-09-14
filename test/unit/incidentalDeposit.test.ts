import { incidentalDeposit } from 'behaviours/incidentalDeposit'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'

describe('incidentalDeposit', () => {
  let creep: any
  let creepPosition: any
  let mockStructure: any

  beforeEach(() => {
    setupGlobals()
    
    mockStructure = {
      store: {
        getFreeCapacity: sinon.stub().returns(100)
      }
    }

    creepPosition = {
      findClosestByRange: sinon.stub(),
      isNearTo: sinon.stub()
    }

    creep = {
      getActiveBodyparts: sinon.stub(),
      store: {
        getFreeCapacity: sinon.stub()
      },
      transfer: sinon.spy()
    }

    // @ts-ignore
    global.WORK = 'work'
    // @ts-ignore
    global.HARVEST_POWER = 2
    // @ts-ignore
    global.FIND_MY_STRUCTURES = 108
    // @ts-ignore
    global.RESOURCE_ENERGY = 'energy'
  })

  it('should return early if creep has sufficient free capacity', () => {
    creep.getActiveBodyparts.returns(5) // 5 work parts
    creep.store.getFreeCapacity.returns(15) // 15 free capacity
    // creepProduction = 5 * 2 = 10
    // creepFreeCapacity - 1 = 15 - 1 = 14
    // 14 > 10, so should return early

    incidentalDeposit({ creep, creepPosition })

    expect(creepPosition.findClosestByRange.notCalled).to.be.true
    expect(creep.transfer.notCalled).to.be.true
  })

  it('should not transfer if no structure is found', () => {
    creep.getActiveBodyparts.returns(5) // 5 work parts
    creep.store.getFreeCapacity.returns(5) // 5 free capacity
    // creepProduction = 5 * 2 = 10
    // creepFreeCapacity - 1 = 5 - 1 = 4
    // 4 <= 10, so should proceed
    
    creepPosition.findClosestByRange.returns(null)

    incidentalDeposit({ creep, creepPosition })

    expect(creepPosition.findClosestByRange.calledOnce).to.be.true
    expect(creep.transfer.notCalled).to.be.true
  })

  it('should not transfer if structure is not near', () => {
    creep.getActiveBodyparts.returns(5) // 5 work parts
    creep.store.getFreeCapacity.returns(5) // 5 free capacity
    
    creepPosition.findClosestByRange.returns(mockStructure)
    creepPosition.isNearTo.returns(false)

    incidentalDeposit({ creep, creepPosition })

    expect(creepPosition.findClosestByRange.calledOnce).to.be.true
    expect(creepPosition.isNearTo.calledWith(mockStructure)).to.be.true
    expect(creep.transfer.notCalled).to.be.true
  })

  it('should transfer energy if structure is found and near', () => {
    creep.getActiveBodyparts.returns(5) // 5 work parts
    creep.store.getFreeCapacity.returns(5) // 5 free capacity
    
    creepPosition.findClosestByRange.returns(mockStructure)
    creepPosition.isNearTo.returns(true)

    incidentalDeposit({ creep, creepPosition })

    expect(creepPosition.findClosestByRange.calledOnce).to.be.true
    expect(creepPosition.isNearTo.calledWith(mockStructure)).to.be.true
    expect(creep.transfer.calledWith(mockStructure, 'energy')).to.be.true
  })

  it('should use correct filter for findClosestByRange', () => {
    creep.getActiveBodyparts.returns(5)
    creep.store.getFreeCapacity.returns(5)
    
    creepPosition.findClosestByRange.returns(mockStructure)
    creepPosition.isNearTo.returns(true)

    incidentalDeposit({ creep, creepPosition })

    expect(creepPosition.findClosestByRange.calledOnce).to.be.true
    
    // Verify the filter function works correctly
    const callArgs = creepPosition.findClosestByRange.getCall(0).args
    expect(callArgs[0]).to.equal(108) // FIND_MY_STRUCTURES
    expect(callArgs[1]).to.have.property('filter')
    
    const filter = callArgs[1].filter
    
    // Test filter with structure that has store and free capacity
    const structureWithStore = {
      store: {
        getFreeCapacity: sinon.stub().returns(50)
      }
    }
    expect(filter(structureWithStore)).to.be.true
    
    // Test filter with structure that has store but no free capacity
    const structureWithoutCapacity = {
      store: {
        getFreeCapacity: sinon.stub().returns(0)
      }
    }
    expect(filter(structureWithoutCapacity)).to.be.false
    
    // Test filter with structure that has no store
    const structureWithoutStore = {}
    expect(filter(structureWithoutStore)).to.be.false
  })

  it('should handle edge case where free capacity equals production + 1', () => {
    creep.getActiveBodyparts.returns(3) // 3 work parts
    creep.store.getFreeCapacity.returns(7) // 7 free capacity
    // creepProduction = 3 * 2 = 6
    // creepFreeCapacity - 1 = 7 - 1 = 6
    // 6 <= 6, so should proceed
    
    creepPosition.findClosestByRange.returns(mockStructure)
    creepPosition.isNearTo.returns(true)

    incidentalDeposit({ creep, creepPosition })

    expect(creepPosition.findClosestByRange.calledOnce).to.be.true
    expect(creep.transfer.calledWith(mockStructure, 'energy')).to.be.true
  })
})
