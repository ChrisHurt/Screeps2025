import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { calculateBodyCost, BODYPART_COST } from '../../src/helpers/calculateBodyCost'
import { setupGlobals } from '../helpers/setupGlobals'

describe('calculateBodyCost', () => {
  beforeEach(() => {
    setupGlobals()
  })

  it('should calculate cost for single work part', () => {
    const result = calculateBodyCost({ body: [WORK] })
    expect(result).to.equal(100)
  })

  it('should calculate cost for single carry part', () => {
    const result = calculateBodyCost({ body: [CARRY] })
    expect(result).to.equal(50)
  })

  it('should calculate cost for single move part', () => {
    const result = calculateBodyCost({ body: [MOVE] })
    expect(result).to.equal(50)
  })

  it('should calculate cost for single attack part', () => {
    const result = calculateBodyCost({ body: [ATTACK] })
    expect(result).to.equal(80)
  })

  it('should calculate cost for single ranged attack part', () => {
    const result = calculateBodyCost({ body: [RANGED_ATTACK] })
    expect(result).to.equal(150)
  })

  it('should calculate cost for single heal part', () => {
    const result = calculateBodyCost({ body: [HEAL] })
    expect(result).to.equal(250)
  })

  it('should calculate cost for single tough part', () => {
    const result = calculateBodyCost({ body: [TOUGH] })
    expect(result).to.equal(10)
  })

  it('should calculate cost for single claim part', () => {
    const result = calculateBodyCost({ body: [CLAIM] })
    expect(result).to.equal(600)
  })

  it('should calculate cost for mixed body parts', () => {
    const result = calculateBodyCost({ body: [WORK, CARRY, MOVE] })
    expect(result).to.equal(100 + 50 + 50) // 200
  })

  it('should calculate cost for multiple same parts', () => {
    const result = calculateBodyCost({ body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] })
    expect(result).to.equal(100 + 100 + 50 + 50 + 50 + 50) // 400
  })

  it('should return 0 for empty body', () => {
    const result = calculateBodyCost({ body: [] })
    expect(result).to.equal(0)
  })

  it('should calculate cost for complex body configuration', () => {
    const result = calculateBodyCost({ body: [TOUGH, ATTACK, MOVE, HEAL, RANGED_ATTACK] })
    expect(result).to.equal(10 + 80 + 50 + 250 + 150) // 540
  })

  it('should have correct BODYPART_COST values', () => {
    expect(BODYPART_COST.attack).to.equal(80)
    expect(BODYPART_COST.carry).to.equal(50)
    expect(BODYPART_COST.claim).to.equal(600)
    expect(BODYPART_COST.heal).to.equal(250)
    expect(BODYPART_COST.move).to.equal(50)
    expect(BODYPART_COST.ranged_attack).to.equal(150)
    expect(BODYPART_COST.tough).to.equal(10)
    expect(BODYPART_COST.work).to.equal(100)
  })
})
