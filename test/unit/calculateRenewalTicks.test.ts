import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { calculateRenewalTicks } from '../../src/helpers/calculateRenewalTicks'
import { setupGlobals } from '../helpers/setupGlobals'

describe('calculateRenewalTicks', () => {
  beforeEach(() => {
    setupGlobals()
  })
  it('should calculate renewal ticks for single body part', () => {
    const result = calculateRenewalTicks({ body: [WORK] })
    // 600 / 1 = 600
    expect(result).to.equal(600)
  })

  it('should calculate renewal ticks for two body parts', () => {
    const result = calculateRenewalTicks({ body: [WORK, CARRY] })
    // floor(600 / 2) = floor(300) = 300
    expect(result).to.equal(300)
  })

  it('should calculate renewal ticks for three body parts', () => {
    const result = calculateRenewalTicks({ body: [WORK, CARRY, MOVE] })
    // floor(600 / 3) = floor(200) = 200
    expect(result).to.equal(200)
  })

  it('should calculate renewal ticks for four body parts', () => {
    const result = calculateRenewalTicks({ body: [WORK, CARRY, MOVE, ATTACK] })
    // floor(600 / 4) = floor(150) = 150
    expect(result).to.equal(150)
  })

  it('should calculate renewal ticks for five body parts', () => {
    const result = calculateRenewalTicks({ body: [WORK, CARRY, MOVE, ATTACK, HEAL] })
    // floor(600 / 5) = floor(120) = 120
    expect(result).to.equal(120)
  })

  it('should calculate renewal ticks for six body parts', () => {
    const result = calculateRenewalTicks({ body: [WORK, CARRY, MOVE, ATTACK, HEAL, TOUGH] })
    // floor(600 / 6) = floor(100) = 100
    expect(result).to.equal(100)
  })

  it('should handle fractional result with proper flooring', () => {
    const result = calculateRenewalTicks({ body: [WORK, CARRY, MOVE, ATTACK, HEAL, TOUGH, RANGED_ATTACK] })
    // floor(600 / 7) = floor(85.71) = 85
    expect(result).to.equal(85)
  })

  it('should calculate renewal ticks for eight body parts', () => {
    const result = calculateRenewalTicks({ body: [WORK, CARRY, MOVE, ATTACK, HEAL, TOUGH, RANGED_ATTACK, CLAIM] })
    // floor(600 / 8) = floor(75) = 75
    expect(result).to.equal(75)
  })

  it('should handle large body configurations', () => {
    const largeBody = new Array(50).fill(WORK) // 50 body parts
    const result = calculateRenewalTicks({ body: largeBody })
    // floor(600 / 50) = floor(12) = 12
    expect(result).to.equal(12)
  })

  it('should handle maximum body parts', () => {
    const maxBody = new Array(600).fill(WORK) // 600 body parts (theoretical max)
    const result = calculateRenewalTicks({ body: maxBody })
    // floor(600 / 600) = floor(1) = 1
    expect(result).to.equal(1)
  })

  it('should calculate renewal ticks for mixed body parts', () => {
    const result = calculateRenewalTicks({ body: [TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE, HEAL, HEAL, CARRY, WORK] })
    // floor(600 / 10) = floor(60) = 60
    expect(result).to.equal(60)
  })
})
