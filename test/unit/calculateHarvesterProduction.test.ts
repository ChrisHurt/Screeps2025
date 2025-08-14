import { expect } from 'chai'
import * as sinon from 'sinon'
import { calculateHarvesterProduction } from '../../src/helpers/calculateHarvesterProduction'

describe('calculateHarvesterProduction', () => {
  let pathFinderStub: sinon.SinonStub
  let sourcePosition: any
  let spawnPositions: any

  beforeEach(() => {
    // @ts-ignore
    pathFinderStub = sinon.stub().returns({ path: [{ x: 1, y: 1, roomName: 'W1N1' }], ops: 0, cost: 0, incomplete: false })
    // @ts-ignore
    global.PathFinder = { search: pathFinderStub }
    sourcePosition = { x: 10, y: 20, roomName: 'W1N1' }
    spawnPositions = [{ x: 15, y: 25, roomName: 'W1N1' }]
  })

  it('should calculate productionPerTick and returnPath with default values', () => {
    const result = calculateHarvesterProduction({ sourcePosition, spawnPositions })
    expect(result.productionPerTick).to.be.a('number')
    expect(result.returnPath).to.be.an('array')
    expect(pathFinderStub.calledOnce).to.be.true
  })

  it('should use roadsOnSwamps and roadsOnPlains options', () => {
    calculateHarvesterProduction({ sourcePosition, spawnPositions, roadsOnSwamps: true, roadsOnPlains: true })
    const args = pathFinderStub.getCall(0).args[2]
    expect(args.plainCost).to.equal(1)
    expect(args.swampCost).to.equal(1)
  })

  it('should calculate correct production for given workParts and carryParts', () => {
    const result = calculateHarvesterProduction({ sourcePosition, spawnPositions, workParts: 2, carryParts: 2 })
    // harvestAmount = 2*50 = 100
    // harvestPerTick = 2*2 = 4
    // miningTime = ceil(100/4) = 25
    // roundTripTicks = pathLength*2 = 2
    // productionPerTick = 100/(25+2) = ~3.7
    expect(result.productionPerTick).to.be.closeTo(3.7, 0.1)
  })

  it('should return empty path if PathFinder returns empty', () => {
    pathFinderStub.returns({ path: [], ops: 0, cost: 0, incomplete: false })
    const result = calculateHarvesterProduction({ sourcePosition, spawnPositions })
    expect(result.returnPath).to.deep.equal([])
  })

  it('should use default values for optional properties', () => {
    // Only required properties
    const result = calculateHarvesterProduction({ sourcePosition, spawnPositions })
    // Should use workParts=1, carryParts=1, roadsOnSwamps=false, roadsOnPlains=false
    expect(result.productionPerTick).to.be.a('number')
    expect(pathFinderStub.getCall(0).args[2].plainCost).to.equal(2)
    expect(pathFinderStub.getCall(0).args[2].swampCost).to.equal(5)
  })

  it('should handle zero workParts and carryParts', () => {
    const result = calculateHarvesterProduction({ sourcePosition, spawnPositions, workParts: 0, carryParts: 0 })
    // harvestAmount = 0, harvestPerTick = 0, miningTime = NaN, productionPerTick = NaN
    expect(result.productionPerTick).to.be.NaN
  })

  it('should handle empty spawnPositions array', () => {
    const result = calculateHarvesterProduction({ sourcePosition, spawnPositions: [] })
    expect(result.returnPath).to.be.an('array')
    expect(result.productionPerTick).to.be.a('number')
    expect(pathFinderStub.calledOnce).to.be.true
  })

  it('should handle undefined optional properties', () => {
    const result = calculateHarvesterProduction({ sourcePosition, spawnPositions, roadsOnSwamps: undefined, roadsOnPlains: undefined, workParts: undefined, carryParts: undefined })
    expect(result.productionPerTick).to.be.a('number')
    expect(result.returnPath).to.be.an('array')
  })

  it('should handle null optional properties', () => {
    const result = calculateHarvesterProduction({ sourcePosition, spawnPositions, roadsOnSwamps: null as any, roadsOnPlains: null as any, workParts: null as any, carryParts: null as any })
    expect(result.productionPerTick).to.be.a('number')
    expect(result.returnPath).to.be.an('array')
  })
})
