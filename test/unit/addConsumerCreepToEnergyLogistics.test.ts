import { expect } from 'chai'
import { addConsumerCreepToEnergyLogistics } from '../../src/helpers/logistics/addConsumerCreepToEnergyLogistics'
import { CreepRole, Urgency } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('addConsumerCreepToEnergyLogistics', () => {
  beforeEach(() => {
    setupGlobals()
    Game.time = 100

    // Initialize Memory
    Memory.energyLogistics = {
      carriers: {},
      consumers: {},
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

  it('should add consumer creep to energy logistics with default timing', () => {
    const creepName = 'test-creep-1'
    addConsumerCreepToEnergyLogistics({
      energy: { current: 50, capacity: 300 },
      name: creepName,
      pos: { x: 10, y: 15 },
      productionPerTick: 5,
      role: CreepRole.BUILDER,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[creepName]
    expect(consumer).to.exist
    expect(consumer.energy.current).to.equal(50)
    expect(consumer.energy.capacity).to.equal(300)
    expect(consumer.pos.x).to.equal(10)
    expect(consumer.pos.y).to.equal(15)
    expect(consumer.roomName).to.equal('W1N1')
    expect(consumer.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(consumer.urgency.war).to.equal(Urgency.MEDIUM)
    expect(consumer.productionPerTick).to.equal(5)
    expect(consumer.type).to.equal(CreepRole.BUILDER)
  })

  it('should add consumer creep with custom timing', () => {
    const creepName = 'test-creep-2'
    addConsumerCreepToEnergyLogistics({
      energy: { current: 100, capacity: 400 },
      name: creepName,
      pos: { x: 5, y: 10 },
      depositTiming: {
        earliestTick: 100,
        latestTick: 200
      },
      productionPerTick: 10,
      role: CreepRole.BUILDER,
      roomName: 'W2N2'
    })

    const consumer = Memory.energyLogistics.consumers[creepName]
    expect(consumer).to.exist
    expect(consumer.depositTiming.latestTick).to.equal(200)
    expect(consumer.productionPerTick).to.equal(10)
  })

  it('should handle upgrader creep with correct urgency', () => {
    const creepName = 'test-upgrader'
    addConsumerCreepToEnergyLogistics({
      energy: { current: 75, capacity: 200 },
      name: creepName,
      pos: { x: 20, y: 25 },
      productionPerTick: 3,
      role: CreepRole.UPGRADER,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[creepName]
    expect(consumer.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(consumer.urgency.war).to.equal(Urgency.MEDIUM)
    expect(consumer.type).to.equal(CreepRole.UPGRADER)
  })

  it('should handle creep with zero production per tick', () => {
    const creepName = 'test-zero-production'
    addConsumerCreepToEnergyLogistics({
      energy: { current: 0, capacity: 150 },
      name: creepName,
      pos: { x: 1, y: 1 },
      productionPerTick: 0,
      role: CreepRole.BUILDER,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[creepName]
    expect(consumer.productionPerTick).to.equal(0)
  })

  it('should handle creep with full energy store', () => {
    const creepName = 'test-full-energy'
    addConsumerCreepToEnergyLogistics({
      energy: { current: 300, capacity: 300 },
      name: creepName,
      pos: { x: 15, y: 20 },
      productionPerTick: 5,
      role: CreepRole.BUILDER,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[creepName]
    expect(consumer.energy.current).to.equal(300)
    expect(consumer.depositTiming.latestTick).to.equal(100) // No free capacity, so immediate
  })

  it('should handle creep with empty energy store', () => {
    const creepName = 'test-empty-energy'
    addConsumerCreepToEnergyLogistics({
      energy: { current: 0, capacity: 250 },
      name: creepName,
      pos: { x: 30, y: 35 },
      productionPerTick: 10,
      role: CreepRole.BUILDER,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[creepName]
    expect(consumer.energy.current).to.equal(0)
  })

  it('should overwrite existing consumer entry', () => {
    const creepName = 'test-overwrite'
    // First add
    addConsumerCreepToEnergyLogistics({
      energy: { current: 50, capacity: 300 },
      name: creepName,
      pos: { x: 10, y: 15 },
      productionPerTick: 5,
      role: CreepRole.BUILDER,
      roomName: 'W1N1'
    })

    // Second add with different values
    addConsumerCreepToEnergyLogistics({
      energy: { current: 100, capacity: 300 },
      name: creepName,
      pos: { x: 10, y: 15 },
      productionPerTick: 8,
      role: CreepRole.BUILDER,
      roomName: 'W1N1'
    })

    const consumer = Memory.energyLogistics.consumers[creepName]
    expect(consumer.energy.current).to.equal(100)
    expect(consumer.productionPerTick).to.equal(8)
  })
})
