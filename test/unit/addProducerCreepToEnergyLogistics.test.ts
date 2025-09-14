import { expect } from 'chai'
import { addProducerCreepToEnergyLogistics } from '../../src/helpers/logistics/addProducerCreepToEnergyLogistics'
import { CreepRole, Urgency } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('addProducerCreepToEnergyLogistics', () => {
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

  it('should add producer creep to energy logistics with default timing', () => {
    const creepName = 'test-creep-1'
    addProducerCreepToEnergyLogistics({
      energy: { current: 50, capacity: 300 },
      name: creepName,
      pos: { x: 10, y: 15 },
      productionPerTick: 5,
      role: CreepRole.HARVESTER,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[creepName]
    expect(producer).to.exist
    expect(producer.energy.current).to.equal(50)
    expect(producer.energy.capacity).to.equal(300)
    expect(producer.pos.x).to.equal(10)
    expect(producer.pos.y).to.equal(15)
    expect(producer.roomName).to.equal('W1N1')
    expect(producer.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(producer.urgency.war).to.equal(Urgency.MEDIUM)
    expect(producer.productionPerTick).to.equal(5)
    expect(producer.type).to.equal(CreepRole.HARVESTER)
  })

  it('should add producer creep with custom timing', () => {
    const creepName = 'test-creep-2'
    addProducerCreepToEnergyLogistics({
      energy: { current: 100, capacity: 400 },
      name: creepName,
      pos: { x: 5, y: 10 },
      withdrawTiming: {
        earliestTick: 100,
        latestTick: 200
      },
      productionPerTick: 10,
      role: CreepRole.HARVESTER,
      roomName: 'W2N2'
    })

    const producer = Memory.energyLogistics.producers[creepName]
    expect(producer).to.exist
    expect(producer.withdrawTiming.earliestTick).to.equal(100)
    expect(producer.withdrawTiming.latestTick).to.equal(200)
    expect(producer.productionPerTick).to.equal(10)
  })

  it('should handle harvester creep with correct urgency', () => {
    const creepName = 'test-harvester'
    addProducerCreepToEnergyLogistics({
      energy: { current: 25, capacity: 150 },
      name: creepName,
      pos: { x: 20, y: 25 },
      productionPerTick: 3,
      role: CreepRole.HARVESTER,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[creepName]
    expect(producer.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(producer.urgency.war).to.equal(Urgency.MEDIUM)
    expect(producer.type).to.equal(CreepRole.HARVESTER)
  })

  it('should handle creep with zero production per tick', () => {
    const creepName = 'test-zero-production'
    addProducerCreepToEnergyLogistics({
      energy: { current: 0, capacity: 200 },
      name: creepName,
      pos: { x: 1, y: 1 },
      productionPerTick: 0,
      role: CreepRole.HARVESTER,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[creepName]
    expect(producer.productionPerTick).to.equal(0)
  })

  it('should handle creep with full energy store', () => {
    const creepName = 'test-full-energy'
    addProducerCreepToEnergyLogistics({
      energy: { current: 300, capacity: 300 },
      name: creepName,
      pos: { x: 15, y: 20 },
      productionPerTick: 5,
      role: CreepRole.HARVESTER,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[creepName]
    expect(producer.energy.current).to.equal(300)
  })

  it('should handle creep with empty energy store', () => {
    const creepName = 'test-empty-energy'
    addProducerCreepToEnergyLogistics({
      energy: { current: 0, capacity: 250 },
      name: creepName,
      pos: { x: 30, y: 35 },
      productionPerTick: 10,
      role: CreepRole.HARVESTER,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[creepName]
    expect(producer.energy.current).to.equal(0)
  })

  it('should use custom room name if provided', () => {
    const creepName = 'test-custom-room'
    addProducerCreepToEnergyLogistics({
      energy: { current: 150, capacity: 300 },
      name: creepName,
      pos: { x: 12, y: 18 },
      productionPerTick: 5,
      role: CreepRole.HARVESTER,
      roomName: 'W2N2'
    })

    const producer = Memory.energyLogistics.producers[creepName]
    expect(producer.roomName).to.equal('W2N2')
  })

  it('should overwrite existing producer entry', () => {
    const creepName = 'test-overwrite'
    // First add
    addProducerCreepToEnergyLogistics({
      energy: { current: 50, capacity: 300 },
      name: creepName,
      pos: { x: 10, y: 15 },
      productionPerTick: 5,
      role: CreepRole.HARVESTER,
      roomName: 'W1N1'
    })

    // Second add with different values
    addProducerCreepToEnergyLogistics({
      energy: { current: 100, capacity: 300 },
      name: creepName,
      pos: { x: 10, y: 15 },
      productionPerTick: 8,
      role: CreepRole.HARVESTER,
      roomName: 'W1N1'
    })

    const producer = Memory.energyLogistics.producers[creepName]
    expect(producer.energy.current).to.equal(100)
    expect(producer.productionPerTick).to.equal(8)
  })
})
