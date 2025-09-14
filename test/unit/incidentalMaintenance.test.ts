import { incidentalMaintenance } from 'behaviours/incidentalMaintenance'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'

describe('incidentalMaintenance', () => {
  let creep: any
  let creepPosition: any
  let mockConstructionSite: any
  let mockStructure: any

  beforeEach(() => {
    setupGlobals()
    
    mockConstructionSite = {
      id: 'construction1',
      pos: { x: 25, y: 25 }
    }

    mockStructure = {
      id: 'structure1',
      pos: { x: 25, y: 25 },
      hits: 500,
      hitsMax: 1000
    }

    creepPosition = {
      findClosestByRange: sinon.stub(),
      inRangeTo: sinon.stub()
    }

    creep = {
      build: sinon.spy(),
      repair: sinon.spy()
    }

    // @ts-ignore
    global.FIND_MY_CONSTRUCTION_SITES = 114
    // @ts-ignore
    global.FIND_STRUCTURES = 107
  })

  it('should build construction site when approaching full energy and build site is in range', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(mockConstructionSite)
    creepPosition.inRangeTo.withArgs(mockConstructionSite, 3).returns(true)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: true,
      creepRepairAmountPerTick: 100
    })

    expect(creep.build.calledWith(mockConstructionSite)).to.be.true
    expect(creep.repair.notCalled).to.be.true
  })

  it('should not build when not approaching full energy even if build site is in range', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(mockConstructionSite)
    creepPosition.inRangeTo.withArgs(mockConstructionSite, 3).returns(true)
    creepPosition.findClosestByRange.withArgs(107).returns(mockStructure)
    creepPosition.inRangeTo.withArgs(mockStructure, 3).returns(true)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: false,
      creepRepairAmountPerTick: 100
    })

    expect(creep.build.notCalled).to.be.true
    expect(creep.repair.calledWith(mockStructure)).to.be.true
  })

  it('should not build when approaching full energy but build site is not in range', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(mockConstructionSite)
    creepPosition.inRangeTo.withArgs(mockConstructionSite, 3).returns(false)
    creepPosition.findClosestByRange.withArgs(107).returns(mockStructure)
    creepPosition.inRangeTo.withArgs(mockStructure, 3).returns(true)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: true,
      creepRepairAmountPerTick: 100
    })

    expect(creep.build.notCalled).to.be.true
    expect(creep.repair.calledWith(mockStructure)).to.be.true
  })

  it('should not build when no construction site is found', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(null)
    creepPosition.findClosestByRange.withArgs(107).returns(mockStructure)
    creepPosition.inRangeTo.withArgs(mockStructure, 3).returns(true)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: true,
      creepRepairAmountPerTick: 100
    })

    expect(creep.build.notCalled).to.be.true
    expect(creep.repair.calledWith(mockStructure)).to.be.true
  })

  it('should repair structure when in range and damage exceeds repair amount', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(null)
    creepPosition.findClosestByRange.withArgs(107).returns(mockStructure)
    creepPosition.inRangeTo.withArgs(mockStructure, 3).returns(true)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: false,
      creepRepairAmountPerTick: 100
    })

    expect(creep.build.notCalled).to.be.true
    expect(creep.repair.calledWith(mockStructure)).to.be.true
  })

  it('should not repair structure when not in range', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(null)
    creepPosition.findClosestByRange.withArgs(107).returns(mockStructure)
    creepPosition.inRangeTo.withArgs(mockStructure, 3).returns(false)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: false,
      creepRepairAmountPerTick: 100
    })

    expect(creep.build.notCalled).to.be.true
    expect(creep.repair.notCalled).to.be.true
  })

  it('should not repair structure when no structure is found', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(null)
    creepPosition.findClosestByRange.withArgs(107).returns(null)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: false,
      creepRepairAmountPerTick: 100
    })

    expect(creep.build.notCalled).to.be.true
    expect(creep.repair.notCalled).to.be.true
  })

  it('should use correct filter for repair structures based on damage vs repair amount', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(null)
    creepPosition.findClosestByRange.withArgs(107).returns(mockStructure)
    creepPosition.inRangeTo.withArgs(mockStructure, 3).returns(true)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: false,
      creepRepairAmountPerTick: 100
    })

    // Verify the filter function works correctly
    const repairCall = creepPosition.findClosestByRange.getCall(1)
    expect(repairCall.args[0]).to.equal(107) // FIND_STRUCTURES
    expect(repairCall.args[1]).to.have.property('filter')
    
    const filter = repairCall.args[1].filter
    
    // Test filter with structure that needs repair (damage > repair amount)
    const damagedStructure = {
      hits: 500,
      hitsMax: 1000 // damage = 500, which is > 100 repair amount
    }
    expect(filter(damagedStructure)).to.be.true
    
    // Test filter with structure that doesn't need much repair (damage <= repair amount)
    const slightlyDamagedStructure = {
      hits: 950,
      hitsMax: 1000 // damage = 50, which is < 100 repair amount
    }
    expect(filter(slightlyDamagedStructure)).to.be.false
    
    // Test filter with undamaged structure
    const undamagedStructure = {
      hits: 1000,
      hitsMax: 1000 // damage = 0, which is < 100 repair amount
    }
    expect(filter(undamagedStructure)).to.be.false
  })

  it('should handle edge case where damage exactly equals repair amount', () => {
    const exactDamageStructure = {
      hits: 900,
      hitsMax: 1000 // damage = 100, exactly equals repair amount
    }
    
    creepPosition.findClosestByRange.withArgs(114).returns(null)
    creepPosition.findClosestByRange.withArgs(107).returns(null) // Should return null since filter excludes this structure
    
    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: false,
      creepRepairAmountPerTick: 100
    })

    // Should not repair because no structure was found (filtered out)
    expect(creep.repair.notCalled).to.be.true
    
    // Verify filter function excludes structures with damage equal to repair amount
    const repairCall = creepPosition.findClosestByRange.getCall(1)
    const filter = repairCall.args[1].filter
    expect(filter(exactDamageStructure)).to.be.false
  })

  it('should prioritize building over repairing when conditions are met', () => {
    creepPosition.findClosestByRange.withArgs(114).returns(mockConstructionSite)
    creepPosition.inRangeTo.withArgs(mockConstructionSite, 3).returns(true)
    // Note: repair structure setup is not needed since build should return early

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: true,
      creepRepairAmountPerTick: 100
    })

    expect(creep.build.calledWith(mockConstructionSite)).to.be.true
    expect(creep.repair.notCalled).to.be.true
    // Verify that repair structure search was not even called due to early return
    expect(creepPosition.findClosestByRange.calledOnce).to.be.true
  })

  it('should handle different repair amounts correctly', () => {
    const heavilyDamagedStructure = {
      hits: 100,
      hitsMax: 1000 // damage = 900
    }
    
    creepPosition.findClosestByRange.withArgs(114).returns(null)
    creepPosition.findClosestByRange.withArgs(107).returns(heavilyDamagedStructure)
    creepPosition.inRangeTo.withArgs(heavilyDamagedStructure, 3).returns(true)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: false,
      creepRepairAmountPerTick: 50 // smaller repair amount
    })

    expect(creep.repair.calledWith(heavilyDamagedStructure)).to.be.true
    
    // Verify filter works with different repair amount
    const repairCall = creepPosition.findClosestByRange.getCall(1)
    const filter = repairCall.args[1].filter
    expect(filter(heavilyDamagedStructure)).to.be.true // 900 damage > 50 repair
    
    const minorDamageStructure = {
      hits: 970,
      hitsMax: 1000 // damage = 30
    }
    expect(filter(minorDamageStructure)).to.be.false // 30 damage < 50 repair
  })

  it('should handle zero repair amount edge case', () => {
    const slightlyDamagedStructure = {
      hits: 999,
      hitsMax: 1000 // damage = 1
    }
    
    creepPosition.findClosestByRange.withArgs(114).returns(null)
    creepPosition.findClosestByRange.withArgs(107).returns(slightlyDamagedStructure)
    creepPosition.inRangeTo.withArgs(slightlyDamagedStructure, 3).returns(true)

    incidentalMaintenance({
      creep,
      creepPosition,
      creepIsApproachingFullEnergy: false,
      creepRepairAmountPerTick: 0
    })

    expect(creep.repair.calledWith(slightlyDamagedStructure)).to.be.true
    
    // Verify filter works with zero repair amount (any damage > 0)
    const repairCall = creepPosition.findClosestByRange.getCall(1)
    const filter = repairCall.args[1].filter
    expect(filter(slightlyDamagedStructure)).to.be.true // 1 damage > 0 repair
    
    const undamagedStructure = {
      hits: 1000,
      hitsMax: 1000 // damage = 0
    }
    expect(filter(undamagedStructure)).to.be.false // 0 damage = 0 repair
  })
})
