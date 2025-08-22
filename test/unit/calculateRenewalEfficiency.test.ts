import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { calculateRenewalEfficiency } from '../../src/helpers/calculateRenewalEfficiency'
import { setupGlobals } from '../helpers/setupGlobals'

describe('calculateRenewalEfficiency', () => {
  beforeEach(() => {
    setupGlobals()
  })
  it('should calculate renewal efficiency for single work part', () => {
    const result = calculateRenewalEfficiency({ body: [WORK] })
    // calculateRenewalCost: ceil(100 / 2.5 / 1) = ceil(40) = 40
    // calculateRenewalTicks: floor(600 / 1) = 600
    // efficiency: 40 / 600 = 0.0667
    expect(result).to.be.closeTo(40 / 600, 0.001)
  })

  it('should calculate renewal efficiency for single carry part', () => {
    const result = calculateRenewalEfficiency({ body: [CARRY] })
    // calculateRenewalCost: ceil(50 / 2.5 / 1) = ceil(20) = 20
    // calculateRenewalTicks: floor(600 / 1) = 600
    // efficiency: 20 / 600 = 0.0333
    expect(result).to.be.closeTo(20 / 600, 0.001)
  })

  it('should calculate renewal efficiency for mixed body parts', () => {
    const result = calculateRenewalEfficiency({ body: [WORK, CARRY, MOVE] })
    // calculateRenewalCost: ceil(200 / 2.5 / 3) = ceil(26.67) = 27
    // calculateRenewalTicks: floor(600 / 3) = 200
    // efficiency: 27 / 200 = 0.135
    expect(result).to.be.closeTo(27 / 200, 0.001)
  })

  it('should calculate renewal efficiency for attack part', () => {
    const result = calculateRenewalEfficiency({ body: [ATTACK] })
    // calculateRenewalCost: ceil(80 / 2.5 / 1) = ceil(32) = 32
    // calculateRenewalTicks: floor(600 / 1) = 600
    // efficiency: 32 / 600 = 0.0533
    expect(result).to.be.closeTo(32 / 600, 0.001)
  })

  it('should calculate renewal efficiency for tough part', () => {
    const result = calculateRenewalEfficiency({ body: [TOUGH] })
    // calculateRenewalCost: ceil(10 / 2.5 / 1) = ceil(4) = 4
    // calculateRenewalTicks: floor(600 / 1) = 600
    // efficiency: 4 / 600 = 0.0067
    expect(result).to.be.closeTo(4 / 600, 0.001)
  })

  it('should calculate renewal efficiency for heal part', () => {
    const result = calculateRenewalEfficiency({ body: [HEAL] })
    // calculateRenewalCost: ceil(250 / 2.5 / 1) = ceil(100) = 100
    // calculateRenewalTicks: floor(600 / 1) = 600
    // efficiency: 100 / 600 = 0.1667
    expect(result).to.be.closeTo(100 / 600, 0.001)
  })

  it('should calculate renewal efficiency for ranged attack part', () => {
    const result = calculateRenewalEfficiency({ body: [RANGED_ATTACK] })
    // calculateRenewalCost: ceil(150 / 2.5 / 1) = ceil(60) = 60
    // calculateRenewalTicks: floor(600 / 1) = 600
    // efficiency: 60 / 600 = 0.1
    expect(result).to.be.closeTo(60 / 600, 0.001)
  })

  it('should calculate renewal efficiency for claim part', () => {
    const result = calculateRenewalEfficiency({ body: [CLAIM] })
    // calculateRenewalCost: ceil(600 / 2.5 / 1) = ceil(240) = 240
    // calculateRenewalTicks: floor(600 / 1) = 600
    // efficiency: 240 / 600 = 0.4
    expect(result).to.be.closeTo(240 / 600, 0.001)
  })

  it('should calculate renewal efficiency for two body parts', () => {
    const result = calculateRenewalEfficiency({ body: [WORK, CARRY] })
    // calculateRenewalCost: ceil(150 / 2.5 / 2) = ceil(30) = 30
    // calculateRenewalTicks: floor(600 / 2) = 300
    // efficiency: 30 / 300 = 0.1
    expect(result).to.be.closeTo(30 / 300, 0.001)
  })

  it('should calculate renewal efficiency for complex body configuration', () => {
    const result = calculateRenewalEfficiency({ body: [TOUGH, ATTACK, MOVE, HEAL] })
    // calculateRenewalCost: ceil(390 / 2.5 / 4) = ceil(39) = 39
    // calculateRenewalTicks: floor(600 / 4) = 150
    // efficiency: 39 / 150 = 0.26
    expect(result).to.be.closeTo(39 / 150, 0.001)
  })

  it('should calculate renewal efficiency for large body', () => {
    const result = calculateRenewalEfficiency({ body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] })
    // calculateRenewalCost: ceil(400 / 2.5 / 6) = ceil(26.67) = 27
    // calculateRenewalTicks: floor(600 / 6) = 100
    // efficiency: 27 / 100 = 0.27
    expect(result).to.be.closeTo(27 / 100, 0.001)
  })

  it('should handle fractional results properly', () => {
    const result = calculateRenewalEfficiency({ body: [TOUGH, TOUGH, TOUGH] })
    // calculateRenewalCost: ceil(30 / 2.5 / 3) = ceil(4) = 4
    // calculateRenewalTicks: floor(600 / 3) = 200
    // efficiency: 4 / 200 = 0.02
    expect(result).to.be.closeTo(4 / 200, 0.001)
  })
})
