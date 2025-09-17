import { expect } from 'chai'
import * as sinon from 'sinon'
import { calculateEnergyProductionByRoom } from '../../src/helpers/calculateEnergyProductionByRoom'
import { setupGlobals } from '../helpers/setupGlobals'

describe('calculateEnergyProductionByRoom', () => {
  let memoryBackup: any
  let consoleSpy: sinon.SinonSpy

  beforeEach(() => {
    setupGlobals()
    // @ts-ignore
    if (!global.Memory) global.Memory = {}
    // @ts-ignore
    memoryBackup = { ...global.Memory }
    // @ts-ignore
    global.Memory.creeps = {
      creep1: {
        energyImpact: { perTickAmount: 100, roomNames: ['W1N1', 'W2N2'] }
      },
      creep2: {
        energyImpact: { perTickAmount: 50, roomNames: ['W1N1'] }
      },
      creep3: {
        energyImpact: { perTickAmount: 30, roomNames: [] }
      }
    }
    // @ts-ignore
    global.Memory.structures = {}
    // @ts-ignore
    global.Memory.rooms = {
      W1N1: {},
      W2N2: {}
    }
    consoleSpy = sinon.spy(console, 'log')
  })

  afterEach(() => {
    // @ts-ignore
    global.Memory = memoryBackup
    consoleSpy.restore()
  })

  it('should calculate energy production per room and set effectiveEnergyPerTick', () => {
    const result = calculateEnergyProductionByRoom()
    expect(result.W1N1).to.be.closeTo(100, 0.01)
    expect(result.W2N2).to.be.closeTo(50, 0.01)
    expect(Memory.rooms.W1N1.effectiveEnergyPerTick).to.be.closeTo(100, 0.01)
    expect(Memory.rooms.W2N2.effectiveEnergyPerTick).to.be.closeTo(50, 0.01)
  })

  it('should log output for each room and total', () => {
    calculateEnergyProductionByRoom()
    expect(consoleSpy.calledWithMatch(/Energy production by room/)).to.be.true
    expect(consoleSpy.calledWithMatch(/W1N1: 100/)).to.be.true
    expect(consoleSpy.calledWithMatch(/W2N2: 50/)).to.be.true
    expect(consoleSpy.calledWithMatch(/Total: 150/)).to.be.true
  })

  it('should handle empty energy array', () => {
    // @ts-ignore
    global.Memory.creeps = {}
    // @ts-ignore
    global.Memory.structures = {}
    const result = calculateEnergyProductionByRoom()
    expect(result).to.deep.equal({})
    expect(consoleSpy.calledWithMatch(/Total: 0/)).to.be.true
  })

  it('should not fail if roomNames is undefined or empty', () => {
    // @ts-ignore
    global.Memory.creeps = {
      creep1: {
        energyImpact: { perTickAmount: 100, roomNames: undefined }
      },
      creep2: {
        energyImpact: { perTickAmount: 50, roomNames: [] }
      }
    }
    // @ts-ignore
    global.Memory.structures = {}
    const result = calculateEnergyProductionByRoom()
    expect(result).to.deep.equal({})
    expect(consoleSpy.calledWithMatch(/Total: 0/)).to.be.true
  })
})
