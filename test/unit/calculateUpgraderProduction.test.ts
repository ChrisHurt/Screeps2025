import { describe, it, beforeEach, before, after } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { calculateUpgraderProduction } from '../../src/calculateUpgraderProduction'
import { setupGlobals } from '../helpers/setupGlobals'

describe('calculateUpgraderProduction', () => {
  let pathFinderStub: sinon.SinonStub

  before(() => {
    setupGlobals()
  })

  beforeEach(() => {
    // @ts-ignore
    pathFinderStub = sinon.stub().returns({ path: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }] })
    // @ts-ignore
    global.PathFinder = { search: pathFinderStub }
    // @ts-ignore
    global.RoomPosition = class {
      constructor(public x: number, public y: number, public roomName: string) {}
    }
  })

  after(() => {
    // pathFinderStub.restore()
  })

  it('should calculate production per tick with default road options', () => {
    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 2,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1'), new RoomPosition(2, 2, 'W1N1')],
      workParts: 1
    })

    expect(result.productionPerTick).to.be.a('number')
    expect(result.productionPerTick).to.be.greaterThan(0)
    expect(result.returnPath).to.deep.equal([{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }])
    expect(pathFinderStub.calledOnce).to.be.true
    expect(pathFinderStub.getCall(0).args[2]).to.deep.equal({
      plainCost: 2,
      swampCost: 5
    })
  })

  it('should calculate production per tick with roads on plains enabled', () => {
    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 2,
      roadsOnPlains: true,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1'), new RoomPosition(2, 2, 'W1N1')],
      workParts: 1
    })

    expect(result.productionPerTick).to.be.a('number')
    expect(result.productionPerTick).to.be.greaterThan(0)
    expect(result.returnPath).to.deep.equal([{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }])
    expect(pathFinderStub.calledOnce).to.be.true
    expect(pathFinderStub.getCall(0).args[2]).to.deep.equal({
      plainCost: 1,
      swampCost: 5
    })
  })

  it('should calculate production per tick with roads on swamps enabled', () => {
    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 2,
      roadsOnSwamps: true,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1'), new RoomPosition(2, 2, 'W1N1')],
      workParts: 1
    })

    expect(result.productionPerTick).to.be.a('number')
    expect(result.productionPerTick).to.be.greaterThan(0)
    expect(result.returnPath).to.deep.equal([{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }])
    expect(pathFinderStub.calledOnce).to.be.true
    expect(pathFinderStub.getCall(0).args[2]).to.deep.equal({
      plainCost: 2,
      swampCost: 1
    })
  })

  it('should calculate production per tick with both road options enabled', () => {
    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 2,
      roadsOnPlains: true,
      roadsOnSwamps: true,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1'), new RoomPosition(2, 2, 'W1N1')],
      workParts: 1
    })

    expect(result.productionPerTick).to.be.a('number')
    expect(result.productionPerTick).to.be.greaterThan(0)
    expect(result.returnPath).to.deep.equal([{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }])
    expect(pathFinderStub.calledOnce).to.be.true
    expect(pathFinderStub.getCall(0).args[2]).to.deep.equal({
      plainCost: 1,
      swampCost: 1
    })
  })

  it('should handle empty path from PathFinder', () => {
    pathFinderStub.returns({ path: [] })

    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 2,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1')],
      workParts: 1
    })

    expect(result.productionPerTick).to.be.a('number')
    expect(result.productionPerTick).to.be.greaterThan(0)
    expect(result.returnPath).to.deep.equal([])
  })

  it('should calculate correct production with multiple carry and work parts', () => {
    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 4,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1')],
      workParts: 2
    })

    expect(result.productionPerTick).to.be.a('number')
    expect(result.productionPerTick).to.be.greaterThan(0)
    expect(result.returnPath).to.be.an('array')
  })

  it('should handle single carry and work part', () => {
    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 1,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1')],
      workParts: 1
    })

    expect(result.productionPerTick).to.be.a('number')
    expect(result.productionPerTick).to.be.greaterThan(0)
    expect(result.returnPath).to.be.an('array')
  })

  it('should handle zero carry parts but work parts present', () => {
    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 0,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1')],
      workParts: 1
    })

    expect(result.productionPerTick).to.equal(0)
    expect(result.returnPath).to.be.an('array')
  })

  it('should handle zero work parts but carry parts present', () => {
    const result = calculateUpgraderProduction({
      controllerPosition: new RoomPosition(25, 25, 'W1N1'),
      carryParts: 2,
      spawnPositions: [new RoomPosition(1, 1, 'W1N1')],
      workParts: 0
    })

    // With 0 work parts, Math.ceil(carryCapacity / (workParts * 2)) would be Math.ceil(100 / 0) = Infinity
    // This should result in productionPerTick = carryCapacity / (Infinity + roundTripTicks) = 0
    expect(result.productionPerTick).to.equal(0)
    expect(result.returnPath).to.be.an('array')
  })
})
