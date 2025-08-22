import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { calculateRenewalCost } from '../../src/helpers/calculateRenewalCost'
import { setupGlobals } from '../helpers/setupGlobals'

describe('calculateRenewalCost', () => {
  beforeEach(() => {
    setupGlobals()
  })
  it('should calculate renewal cost for single work part', () => {
    const result = calculateRenewalCost({ body: [WORK] })
    // 100 / 2.5 / 1 = 40, ceil(40) = 40
    expect(result).to.equal(40)
  })

  it('should calculate renewal cost for single carry part', () => {
    const result = calculateRenewalCost({ body: [CARRY] })
    // 50 / 2.5 / 1 = 20, ceil(20) = 20
    expect(result).to.equal(20)
  })

  it('should calculate renewal cost for single move part', () => {
    const result = calculateRenewalCost({ body: [MOVE] })
    // 50 / 2.5 / 1 = 20, ceil(20) = 20
    expect(result).to.equal(20)
  })

  it('should calculate renewal cost for mixed body parts', () => {
    const result = calculateRenewalCost({ body: [WORK, CARRY, MOVE] })
    // (100 + 50 + 50) / 2.5 / 3 = 200 / 2.5 / 3 = 26.67, ceil(26.67) = 27
    expect(result).to.equal(27)
  })

  it('should calculate renewal cost for multiple same parts', () => {
    const result = calculateRenewalCost({ body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] })
    // (100 + 100 + 50 + 50 + 50 + 50) / 2.5 / 6 = 400 / 2.5 / 6 = 26.67, ceil(26.67) = 27
    expect(result).to.equal(27)
  })

  it('should calculate renewal cost for attack part', () => {
    const result = calculateRenewalCost({ body: [ATTACK] })
    // 80 / 2.5 / 1 = 32, ceil(32) = 32
    expect(result).to.equal(32)
  })

  it('should calculate renewal cost for tough part', () => {
    const result = calculateRenewalCost({ body: [TOUGH] })
    // 10 / 2.5 / 1 = 4, ceil(4) = 4
    expect(result).to.equal(4)
  })

  it('should calculate renewal cost for heal part', () => {
    const result = calculateRenewalCost({ body: [HEAL] })
    // 250 / 2.5 / 1 = 100, ceil(100) = 100
    expect(result).to.equal(100)
  })

  it('should calculate renewal cost for ranged attack part', () => {
    const result = calculateRenewalCost({ body: [RANGED_ATTACK] })
    // 150 / 2.5 / 1 = 60, ceil(60) = 60
    expect(result).to.equal(60)
  })

  it('should calculate renewal cost for claim part', () => {
    const result = calculateRenewalCost({ body: [CLAIM] })
    // 600 / 2.5 / 1 = 240, ceil(240) = 240
    expect(result).to.equal(240)
  })

  it('should handle fractional result with proper ceiling', () => {
    const result = calculateRenewalCost({ body: [TOUGH, TOUGH, TOUGH] })
    // (10 + 10 + 10) / 2.5 / 3 = 30 / 2.5 / 3 = 4, ceil(4) = 4
    expect(result).to.equal(4)
  })

  it('should handle complex body configuration', () => {
    const result = calculateRenewalCost({ body: [TOUGH, ATTACK, MOVE, HEAL] })
    // (10 + 80 + 50 + 250) / 2.5 / 4 = 390 / 2.5 / 4 = 39, ceil(39) = 39
    expect(result).to.equal(39)
  })

  it('should handle fractional result requiring ceiling', () => {
    const result = calculateRenewalCost({ body: [WORK, CARRY] })
    // (100 + 50) / 2.5 / 2 = 150 / 2.5 / 2 = 30, ceil(30) = 30
    expect(result).to.equal(30)
  })
})
