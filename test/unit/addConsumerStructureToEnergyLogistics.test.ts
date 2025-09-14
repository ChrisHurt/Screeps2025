import { expect } from 'chai'
import { addConsumerStructureToEnergyLogistics } from '../../src/helpers/logistics/addConsumerStructureToEnergyLogistics'
import { Urgency } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('addConsumerStructureToEnergyLogistics', () => {
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

  it('should add consumer structure to energy logistics with default timing', () => {
    const structureName = 'test-structure-1'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 150, capacity: 300 },
      pos: { x: 10, y: 15 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 5,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer).to.exist
    expect(consumer.energy.current).to.equal(150)
    expect(consumer.energy.capacity).to.equal(300)
    expect(consumer.pos.x).to.equal(10)
    expect(consumer.pos.y).to.equal(15)
    expect(consumer.roomName).to.equal('W1N1')
    expect(consumer.urgency.peace).to.equal(Urgency.HIGH)
    expect(consumer.urgency.war).to.equal(Urgency.HIGH)
    expect(consumer.productionPerTick).to.equal(5)
    expect(consumer.type).to.equal(STRUCTURE_SPAWN)
    expect(consumer.decayTiming).to.be.undefined
  })

  it('should add consumer structure with custom timing', () => {
    const structureName = 'test-structure-2'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 100, capacity: 300 },
      pos: { x: 5, y: 10 },
      structureType: STRUCTURE_EXTENSION,
      productionPerTick: 10,
      roomName: 'W1N1',
      depositTiming: {
        earliestTick: 100,
        latestTick: 200
      }
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer).to.exist
    expect(consumer.depositTiming.latestTick).to.equal(200)
    expect(consumer.depositTiming.earliestTick).to.equal(100)
    expect(consumer.productionPerTick).to.equal(10)
    expect(consumer.type).to.equal(STRUCTURE_EXTENSION)
  })

  it('should handle tower structure with correct urgency', () => {
    const structureName = 'test-tower-1'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 200, capacity: 1000 },
      pos: { x: 25, y: 25 },
      structureType: STRUCTURE_TOWER,
      productionPerTick: 3,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(consumer.urgency.war).to.equal(Urgency.CRITICAL)
    expect(consumer.type).to.equal(STRUCTURE_TOWER)
  })

  it('should handle extension structure with high urgency', () => {
    const structureName = 'test-extension-1'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 25, capacity: 50 },
      pos: { x: 20, y: 30 },
      structureType: STRUCTURE_EXTENSION,
      productionPerTick: 2,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.urgency.peace).to.equal(Urgency.HIGH)
    expect(consumer.urgency.war).to.equal(Urgency.HIGH)
    expect(consumer.type).to.equal(STRUCTURE_EXTENSION)
  })

  it('should handle container structure with low urgency', () => {
    const structureName = 'test-container-1'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 1500, capacity: 2000 },
      pos: { x: 15, y: 25 },
      structureType: STRUCTURE_CONTAINER,
      productionPerTick: 4,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.urgency.peace).to.equal(Urgency.LOW)
    expect(consumer.urgency.war).to.equal(Urgency.LOW)
    expect(consumer.type).to.equal(STRUCTURE_CONTAINER)
  })

  it('should handle lab structure with medium/low urgency', () => {
    const structureName = 'test-lab-1'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 1800, capacity: 2000 },
      pos: { x: 30, y: 35 },
      structureType: STRUCTURE_LAB,
      productionPerTick: 1,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(consumer.urgency.war).to.equal(Urgency.LOW)
    expect(consumer.type).to.equal(STRUCTURE_LAB)
  })

  it('should handle road structure with low urgency', () => {
    const structureName = 'test-road-1'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 0, capacity: 0 }, // Roads don't store energy but need repair
      pos: { x: 12, y: 18 },
      structureType: STRUCTURE_ROAD,
      productionPerTick: 0,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.urgency.peace).to.equal(Urgency.LOW)
    expect(consumer.urgency.war).to.equal(Urgency.LOW)
    expect(consumer.type).to.equal(STRUCTURE_ROAD)
  })

  it('should handle rampart structure with low/high urgency', () => {
    const structureName = 'test-rampart-1'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 0, capacity: 0 }, // Ramparts don't store energy but need repair
      pos: { x: 40, y: 20 },
      structureType: STRUCTURE_RAMPART,
      productionPerTick: 0,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.urgency.peace).to.equal(Urgency.LOW)
    expect(consumer.urgency.war).to.equal(Urgency.HIGH)
    expect(consumer.type).to.equal(STRUCTURE_RAMPART)
  })

  it('should add decay timing when provided', () => {
    const structureName = 'test-decaying-structure'
    const decayTiming = {
      interval: 50,
      threshold: 100,
      earliestTick: Game.time + 50,
      latestTick: Game.time + 300
    }

    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 0, capacity: 0 },
      pos: { x: 22, y: 28 },
      structureType: STRUCTURE_ROAD,
      productionPerTick: 5,
      roomName: 'W1N1',
      decayTiming
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.decayTiming).to.exist
    expect(consumer.decayTiming!.earliestTick).to.equal(Game.time + 50)
    expect(consumer.decayTiming!.latestTick).to.equal(Game.time + 300)
    expect(consumer.decayTiming!.threshold).to.equal(100)
    expect(consumer.decayTiming!.interval).to.equal(50)
  })

  it('should not add decay timing when not provided', () => {
    const structureName = 'test-no-decay-structure'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 150, capacity: 300 },
      pos: { x: 8, y: 12 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 5,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.decayTiming).to.be.undefined
  })

  it('should use custom deposit timing when provided', () => {
    const structureName = 'test-custom-timing'
    const customTiming = {
      earliestTick: Game.time + 10,
      latestTick: Game.time + 50
    }

    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 100, capacity: 200 },
      pos: { x: 33, y: 17 },
      structureType: STRUCTURE_EXTENSION,
      productionPerTick: 3,
      roomName: 'W1N1',
      depositTiming: customTiming
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.depositTiming.earliestTick).to.equal(Game.time + 10)
    expect(consumer.depositTiming.latestTick).to.equal(Game.time + 50)
  })

  it('should use default deposit timing when not provided', () => {
    const structureName = 'test-default-timing'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 75, capacity: 150 },
      pos: { x: 18, y: 22 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 4,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.depositTiming.earliestTick).to.equal(Game.time)
    expect(consumer.depositTiming.latestTick).to.equal(Game.time)
  })

  it('should overwrite existing consumer entry', () => {
    const structureName = 'test-overwrite'
    
    // First add
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 100, capacity: 300 },
      pos: { x: 10, y: 15 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 5,
      roomName: 'W1N1'
    })

    // Second add with different values
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 200, capacity: 300 },
      pos: { x: 11, y: 16 },
      structureType: STRUCTURE_TOWER,
      productionPerTick: 8,
      roomName: 'W2N2'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.energy.current).to.equal(200)
    expect(consumer.pos.x).to.equal(11)
    expect(consumer.pos.y).to.equal(16)
    expect(consumer.productionPerTick).to.equal(8)
    expect(consumer.type).to.equal(STRUCTURE_TOWER)
    expect(consumer.roomName).to.equal('W2N2')
  })

  it('should handle zero production per tick', () => {
    const structureName = 'test-zero-production'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 0, capacity: 0 },
      pos: { x: 45, y: 35 },
      structureType: STRUCTURE_ROAD,
      productionPerTick: 0,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.productionPerTick).to.equal(0)
    expect(consumer.type).to.equal(STRUCTURE_ROAD)
  })

  it('should handle structures at full capacity', () => {
    const structureName = 'test-full-capacity'
    addConsumerStructureToEnergyLogistics({
      name: structureName,
      energy: { current: 300, capacity: 300 },
      pos: { x: 26, y: 14 },
      structureType: STRUCTURE_SPAWN,
      productionPerTick: 1,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[structureName]
    expect(consumer.energy.current).to.equal(300)
    expect(consumer.energy.capacity).to.equal(300)
  })
})
