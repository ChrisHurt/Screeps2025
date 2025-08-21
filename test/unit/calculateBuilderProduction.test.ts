import { expect } from 'chai'
import { calculateBuilderProduction } from '../../src/calculateBuilderProduction'
import { setupGlobals } from '../helpers/setupGlobals'

describe('calculateBuilderProduction', () => {
  beforeEach(() => {
    setupGlobals()
  })

  it('should calculate production per tick for a creep with work and carry parts', () => {
    const creepBody: BodyPartConstant[] = [WORK, WORK, CARRY, CARRY, MOVE, MOVE]
    const path: RoomPosition[] = [
      new RoomPosition(10, 10, 'W1N1'),
      new RoomPosition(11, 10, 'W1N1'),
      new RoomPosition(12, 10, 'W1N1')
    ]

    const result = calculateBuilderProduction({ creepBody, path })
    
    // carryCapacity = 2 * 50 = 100
    // workParts = 2
    // buildTicks = ceil(100 / (2 * 2)) = ceil(25) = 25
    // roundTripTicks = 3 * 2 = 6
    // productionPerTick = 100 / (25 + 6) = ~3.23
    expect(result).to.be.closeTo(3.23, 0.1)
  })

  it('should handle creep with only carry parts', () => {
    const creepBody: BodyPartConstant[] = [CARRY, CARRY, MOVE, MOVE]
    const path: RoomPosition[] = [new RoomPosition(10, 10, 'W1N1')]

    const result = calculateBuilderProduction({ creepBody, path })
    
    // carryCapacity = 2 * 50 = 100
    // workParts = 0
    // buildTicks = ceil(100 / (0 * 2)) = Infinity (but we'll get 0 work parts)
    expect(result).to.equal(0) // Should handle division by zero case
  })

  it('should handle creep with only work parts', () => {
    const creepBody: BodyPartConstant[] = [WORK, WORK, MOVE, MOVE]
    const path: RoomPosition[] = [new RoomPosition(10, 10, 'W1N1')]

    const result = calculateBuilderProduction({ creepBody, path })
    
    // carryCapacity = 0
    // workParts = 2
    // buildTicks = ceil(0 / (2 * 2)) = 0
    // roundTripTicks = 1 * 2 = 2
    // productionPerTick = 0 / (0 + 2) = 0
    expect(result).to.equal(0)
  })

  it('should handle empty creep body', () => {
    const creepBody: BodyPartConstant[] = []
    const path: RoomPosition[] = [new RoomPosition(10, 10, 'W1N1')]

    const result = calculateBuilderProduction({ creepBody, path })
    
    expect(result).to.equal(0)
  })

  it('should handle empty path', () => {
    const creepBody: BodyPartConstant[] = [WORK, CARRY, MOVE]
    const path: RoomPosition[] = []

    const result = calculateBuilderProduction({ creepBody, path })
    
    // carryCapacity = 50
    // workParts = 1
    // buildTicks = ceil(50 / (1 * 2)) = 25
    // roundTripTicks = 0 * 2 = 0
    // productionPerTick = 50 / (25 + 0) = 2
    expect(result).to.equal(2)
  })

  it('should handle creep with mixed body parts', () => {
    const creepBody: BodyPartConstant[] = [WORK, CARRY, MOVE, ATTACK, TOUGH, CARRY, WORK]
    const path: RoomPosition[] = [
      new RoomPosition(5, 5, 'W1N1'),
      new RoomPosition(6, 5, 'W1N1')
    ]

    const result = calculateBuilderProduction({ creepBody, path })
    
    // carryCapacity = 2 * 50 = 100
    // workParts = 2
    // buildTicks = ceil(100 / (2 * 2)) = 25
    // roundTripTicks = 2 * 2 = 4
    // productionPerTick = 100 / (25 + 4) = ~3.45
    expect(result).to.be.closeTo(3.45, 0.1)
  })

  it('should handle long path correctly', () => {
    const creepBody: BodyPartConstant[] = [WORK, CARRY, MOVE]
    const path: RoomPosition[] = new Array(10).fill(null).map((_, i) => 
      new RoomPosition(i, 10, 'W1N1')
    )

    const result = calculateBuilderProduction({ creepBody, path })
    
    // carryCapacity = 50
    // workParts = 1
    // buildTicks = ceil(50 / (1 * 2)) = 25
    // roundTripTicks = 10 * 2 = 20
    // productionPerTick = 50 / (25 + 20) = ~1.11
    expect(result).to.be.closeTo(1.11, 0.1)
  })
})
