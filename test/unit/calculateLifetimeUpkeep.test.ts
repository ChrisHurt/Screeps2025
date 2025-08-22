import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { calculateLifetimeUpkeep } from '../../src/helpers/calculateLifetimeUpkeep'
import { setupGlobals } from '../helpers/setupGlobals'

describe('calculateLifetimeUpkeep', () => {
  beforeEach(() => {
    setupGlobals()
  })
  it('should calculate lifetime upkeep for single work part', () => {
    const result = calculateLifetimeUpkeep({ body: [WORK] })
    // 100 / 1500 = 0.0667
    expect(result).to.be.closeTo(100 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for single carry part', () => {
    const result = calculateLifetimeUpkeep({ body: [CARRY] })
    // 50 / 1500 = 0.0333
    expect(result).to.be.closeTo(50 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for single move part', () => {
    const result = calculateLifetimeUpkeep({ body: [MOVE] })
    // 50 / 1500 = 0.0333
    expect(result).to.be.closeTo(50 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for mixed body parts', () => {
    const result = calculateLifetimeUpkeep({ body: [WORK, CARRY, MOVE] })
    // (100 + 50 + 50) / 1500 = 200 / 1500 = 0.1333
    expect(result).to.be.closeTo(200 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for multiple same parts', () => {
    const result = calculateLifetimeUpkeep({ body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] })
    // (100 + 100 + 50 + 50 + 50 + 50) / 1500 = 400 / 1500 = 0.2667
    expect(result).to.be.closeTo(400 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for attack part', () => {
    const result = calculateLifetimeUpkeep({ body: [ATTACK] })
    // 80 / 1500 = 0.0533
    expect(result).to.be.closeTo(80 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for tough part', () => {
    const result = calculateLifetimeUpkeep({ body: [TOUGH] })
    // 10 / 1500 = 0.0067
    expect(result).to.be.closeTo(10 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for heal part', () => {
    const result = calculateLifetimeUpkeep({ body: [HEAL] })
    // 250 / 1500 = 0.1667
    expect(result).to.be.closeTo(250 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for ranged attack part', () => {
    const result = calculateLifetimeUpkeep({ body: [RANGED_ATTACK] })
    // 150 / 1500 = 0.1
    expect(result).to.be.closeTo(150 / 1500, 0.001)
  })

  it('should calculate lifetime upkeep for claim part', () => {
    const result = calculateLifetimeUpkeep({ body: [CLAIM] })
    // 600 / 1500 = 0.4
    expect(result).to.be.closeTo(600 / 1500, 0.001)
  })

  it('should return 0 for empty body', () => {
    const result = calculateLifetimeUpkeep({ body: [] })
    // 0 / 1500 = 0
    expect(result).to.equal(0)
  })

  it('should calculate lifetime upkeep for complex body configuration', () => {
    const result = calculateLifetimeUpkeep({ body: [TOUGH, ATTACK, MOVE, HEAL, RANGED_ATTACK] })
    // (10 + 80 + 50 + 250 + 150) / 1500 = 540 / 1500 = 0.36
    expect(result).to.be.closeTo(540 / 1500, 0.001)
  })

  it('should handle large expensive body parts', () => {
    const result = calculateLifetimeUpkeep({ body: [CLAIM, CLAIM, CLAIM] })
    // (600 + 600 + 600) / 1500 = 1800 / 1500 = 1.2
    expect(result).to.be.closeTo(1800 / 1500, 0.001)
  })
})
