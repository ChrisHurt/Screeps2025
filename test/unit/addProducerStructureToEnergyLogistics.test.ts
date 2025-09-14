import { expect } from 'chai'
import { addProducerStructureToEnergyLogistics } from '../../src/helpers/logistics/addProducerStructureToEnergyLogistics'
import { Urgency } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('addProducerStructureToEnergyLogistics', () => {
  beforeEach(() => {
    setupGlobals()
    Game.time = 100

    // Initialize Memory
    Memory.energyLogistics = {
      carriers: {},
      consumers: {},
      hauling: {},
      producers: {},
      stores: {},
      linkGroups: {},
      roomStates: {},
      terminals: {}
    }
  })

  afterEach(() => {
    delete (Game as any).time
    delete (Memory as any).energyLogistics
  })

  it('should add producer structure to energy logistics with default timing', () => {
    const structureName = 'test-structure-1'
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 150, capacity: 300 },
      pos: { x: 10, y: 15 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 5,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer).to.exist
    expect(producer.energy.current).to.equal(150)
    expect(producer.energy.capacity).to.equal(300)
    expect(producer.pos.x).to.equal(10)
    expect(producer.pos.y).to.equal(15)
    expect(producer.roomName).to.equal('W1N1')
    expect(producer.urgency.peace).to.equal(Urgency.HIGH)
    expect(producer.urgency.war).to.equal(Urgency.HIGH)
    expect(producer.productionPerTick).to.equal(5)
    expect(producer.type).to.equal(STRUCTURE_SPAWN)
  })

  it('should add producer structure with custom timing', () => {
    const structureName = 'test-structure-2'
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 100, capacity: 400 },
      pos: { x: 5, y: 10 },
      structureType: STRUCTURE_SPAWN,
      withdrawTiming: {
        earliestTick: 100,
        latestTick: 200
      },
      productionPerTick: 10,
      roomName: 'W2N2'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer).to.exist
    expect(producer.withdrawTiming.earliestTick).to.equal(100)
    expect(producer.withdrawTiming.latestTick).to.equal(200)
    expect(producer.productionPerTick).to.equal(10)
  })

  it('should handle spawn structure with correct urgency', () => {
    const structureName = 'test-spawn'
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 200, capacity: 300 },
      pos: { x: 20, y: 25 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 3,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer.urgency.peace).to.equal(Urgency.HIGH)
    expect(producer.urgency.war).to.equal(Urgency.HIGH)
    expect(producer.type).to.equal(STRUCTURE_SPAWN)
  })

  it('should handle structure with zero production per tick', () => {
    const structureName = 'test-zero-production'
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 0, capacity: 200 },
      pos: { x: 1, y: 1 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 0,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer.productionPerTick).to.equal(0)
  })

  it('should handle structure with full energy store', () => {
    const structureName = 'test-full-energy'
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 300, capacity: 300 },
      pos: { x: 12, y: 18 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 5,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer.energy.current).to.equal(300)
  })

  it('should handle structure with empty energy store', () => {
    const structureName = 'test-empty-energy'
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 0, capacity: 250 },
      pos: { x: 25, y: 30 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 10,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer.energy.current).to.equal(0)
  })

  it('should handle structure with decay timing', () => {
    const structureName = 'test-decay'
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 150, capacity: 300 },
      pos: { x: 40, y: 45 },
      structureType: STRUCTURE_SPAWN,
      decayTiming: {
        interval: 100,
        threshold: 50,
        earliestTick: 200,
        latestTick: 300
      },
      productionPerTick: 5,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer.energy.current).to.equal(150)
    expect(producer.productionPerTick).to.equal(5)
  })

  it('should use custom room name if provided', () => {
    const structureName = 'test-custom-room'
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 150, capacity: 300 },
      pos: { x: 8, y: 12 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 5,
      roomName: 'W3N3'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer.roomName).to.equal('W3N3')
  })

  it('should overwrite existing producer entry', () => {
    const structureName = 'test-overwrite'
    // First add
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 50, capacity: 300 },
      pos: { x: 10, y: 15 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 5,
      roomName: 'W1N1'
    })

    // Second add with different values
    addProducerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 100, capacity: 300 },
      pos: { x: 10, y: 15 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 8,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[structureName]
    expect(producer.energy.current).to.equal(100)
    expect(producer.productionPerTick).to.equal(8)
  })
})
