import { expect } from 'chai'
import { addStoreToEnergyLogistics } from '../../src/helpers/logistics/addStoreToEnergyLogistics'
import { Urgency } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('addStoreToEnergyLogistics', () => {
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

  it('should add container store to energy logistics', () => {
    const storeName = 'test-container-1'
    addStoreToEnergyLogistics({
      name: storeName,
      energy: { current: 1500, capacity: 2000 },
      pos: { x: 25, y: 25 },
      roomName: 'W1N1',
      structureType: STRUCTURE_CONTAINER
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store).to.exist
    expect(store.energy.current).to.equal(1500)
    expect(store.energy.capacity).to.equal(2000)
    expect(store.pos.x).to.equal(25)
    expect(store.pos.y).to.equal(25)
    expect(store.roomName).to.equal('W1N1')
    expect(store.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(store.urgency.war).to.equal(Urgency.MEDIUM)
    expect(store.type).to.equal(STRUCTURE_CONTAINER)
  })

  it('should add storage store to energy logistics', () => {
    const storeName = 'test-storage-1'
    addStoreToEnergyLogistics({
      name: storeName,
      energy: { current: 50000, capacity: 1000000 },
      pos: { x: 30, y: 20 },
      roomName: 'W2N2',
      structureType: STRUCTURE_STORAGE
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store).to.exist
    expect(store.energy.current).to.equal(50000)
    expect(store.energy.capacity).to.equal(1000000)
    expect(store.pos.x).to.equal(30)
    expect(store.pos.y).to.equal(20)
    expect(store.roomName).to.equal('W2N2')
    expect(store.urgency.peace).to.equal(Urgency.HIGH)
    expect(store.urgency.war).to.equal(Urgency.HIGH)
    expect(store.type).to.equal(STRUCTURE_STORAGE)
  })

  it('should add terminal store to energy logistics', () => {
    const storeName = 'test-terminal-1'
    addStoreToEnergyLogistics({
      name: storeName,
      energy: { current: 75000, capacity: 300000 },
      pos: { x: 15, y: 35 },
      roomName: 'W3N3',
      structureType: STRUCTURE_TERMINAL
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store).to.exist
    expect(store.energy.current).to.equal(75000)
    expect(store.energy.capacity).to.equal(300000)
    expect(store.pos.x).to.equal(15)
    expect(store.pos.y).to.equal(35)
    expect(store.roomName).to.equal('W3N3')
    expect(store.urgency.peace).to.equal(Urgency.HIGH)
    expect(store.urgency.war).to.equal(Urgency.CRITICAL)
    expect(store.type).to.equal(STRUCTURE_TERMINAL)
  })

  it('should handle empty store capacity', () => {
    const storeName = 'test-empty-container'
    addStoreToEnergyLogistics({
      name: storeName,
      energy: { current: 0, capacity: 0 },
      pos: { x: 5, y: 5 },
      roomName: 'W1N1',
      structureType: STRUCTURE_CONTAINER
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store.energy.current).to.equal(0)
    expect(store.energy.capacity).to.equal(0)
    expect(store.type).to.equal(STRUCTURE_CONTAINER)
  })

  it('should handle full store capacity', () => {
    const storeName = 'test-full-storage'
    addStoreToEnergyLogistics({
      name: storeName,
      energy: { current: 1000000, capacity: 1000000 },
      pos: { x: 40, y: 10 },
      roomName: 'W1N1',
      structureType: STRUCTURE_STORAGE
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store.energy.current).to.equal(1000000)
    expect(store.energy.capacity).to.equal(1000000)
    expect(store.type).to.equal(STRUCTURE_STORAGE)
  })

  it('should overwrite existing store entry', () => {
    const storeName = 'test-overwrite'
    
    // First add
    addStoreToEnergyLogistics({
      name: storeName,
      energy: { current: 1000, capacity: 2000 },
      pos: { x: 20, y: 20 },
      roomName: 'W1N1',
      structureType: STRUCTURE_CONTAINER
    })

    // Second add with different values
    addStoreToEnergyLogistics({
      name: storeName,
      energy: { current: 50000, capacity: 1000000 },
      pos: { x: 25, y: 25 },
      roomName: 'W2N2',
      structureType: STRUCTURE_STORAGE
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store.energy.current).to.equal(50000)
    expect(store.energy.capacity).to.equal(1000000)
    expect(store.pos.x).to.equal(25)
    expect(store.pos.y).to.equal(25)
    expect(store.roomName).to.equal('W2N2')
    expect(store.type).to.equal(STRUCTURE_STORAGE)
    expect(store.urgency.peace).to.equal(Urgency.HIGH)
    expect(store.urgency.war).to.equal(Urgency.HIGH)
  })

  it('should handle different room names', () => {
    const stores = [
      { name: 'store-w1n1', room: 'W1N1' },
      { name: 'store-w2n2', room: 'W2N2' },
      { name: 'store-e5s10', room: 'E5S10' }
    ]

    stores.forEach(({ name, room }) => {
      addStoreToEnergyLogistics({
        name,
        energy: { current: 1000, capacity: 2000 },
        pos: { x: 10, y: 10 },
        roomName: room,
        structureType: STRUCTURE_CONTAINER
      })
    })

    stores.forEach(({ name, room }) => {
      const store = Memory.energyLogistics.stores[name]
      expect(store.roomName).to.equal(room)
    })
  })

  it('should handle edge case positions', () => {
    const testCases = [
      { name: 'corner-0-0', pos: { x: 0, y: 0 } },
      { name: 'corner-49-49', pos: { x: 49, y: 49 } },
      { name: 'edge-25-0', pos: { x: 25, y: 0 } },
      { name: 'edge-0-25', pos: { x: 0, y: 25 } }
    ]

    testCases.forEach(({ name, pos }) => {
      addStoreToEnergyLogistics({
        name,
        energy: { current: 500, capacity: 1000 },
        pos,
        roomName: 'W1N1',
        structureType: STRUCTURE_CONTAINER
      })
    })

    testCases.forEach(({ name, pos }) => {
      const store = Memory.energyLogistics.stores[name]
      expect(store.pos.x).to.equal(pos.x)
      expect(store.pos.y).to.equal(pos.y)
    })
  })

  it('should verify urgency levels for each store type', () => {
    const storeTypes = [
      {
        type: STRUCTURE_CONTAINER,
        expectedPeace: Urgency.MEDIUM,
        expectedWar: Urgency.MEDIUM
      },
      {
        type: STRUCTURE_STORAGE,
        expectedPeace: Urgency.HIGH,
        expectedWar: Urgency.HIGH
      },
      {
        type: STRUCTURE_TERMINAL,
        expectedPeace: Urgency.HIGH,
        expectedWar: Urgency.CRITICAL
      }
    ]

    storeTypes.forEach(({ type, expectedPeace, expectedWar }, index) => {
      const storeName = `test-urgency-${index}`
      addStoreToEnergyLogistics({
        name: storeName,
        energy: { current: 1000, capacity: 2000 },
        pos: { x: 20, y: 20 },
        roomName: 'W1N1',
        structureType: type
      })

      const store = Memory.energyLogistics.stores[storeName]
      expect(store.urgency.peace).to.equal(expectedPeace)
      expect(store.urgency.war).to.equal(expectedWar)
    })
  })

  it('should maintain store state across multiple additions', () => {
    const stores = [
      { name: 'container-1', type: STRUCTURE_CONTAINER },
      { name: 'storage-1', type: STRUCTURE_STORAGE },
      { name: 'terminal-1', type: STRUCTURE_TERMINAL }
    ]

    stores.forEach(({ name, type }) => {
      addStoreToEnergyLogistics({
        name,
        energy: { current: 1000, capacity: 2000 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        structureType: type
      })
    })

    // Verify all stores exist
    expect(Object.keys(Memory.energyLogistics.stores)).to.have.length(3)
    stores.forEach(({ name }) => {
      expect(Memory.energyLogistics.stores[name]).to.exist
    })
  })

  it('should handle various energy levels', () => {
    const energyLevels = [
      { current: 0, capacity: 2000 },
      { current: 1000, capacity: 2000 },
      { current: 2000, capacity: 2000 },
      { current: 999999, capacity: 1000000 }
    ]

    energyLevels.forEach(({ current, capacity }, index) => {
      const storeName = `energy-test-${index}`
      addStoreToEnergyLogistics({
        name: storeName,
        energy: { current, capacity },
        pos: { x: 15, y: 15 },
        roomName: 'W1N1',
        structureType: STRUCTURE_CONTAINER
      })

      const store = Memory.energyLogistics.stores[storeName]
      expect(store.energy.current).to.equal(current)
      expect(store.energy.capacity).to.equal(capacity)
    })
  })

  it('should preserve other energy logistics sections when adding stores', () => {
    // Pre-populate other sections
    Memory.energyLogistics.consumers['test-consumer'] = {
      energy: { current: 100, capacity: 300 },
      pos: { x: 5, y: 5 },
      roomName: 'W1N1',
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      depositTiming: { earliestTick: Game.time, latestTick: Game.time + 100 },
      productionPerTick: 5,
      type: STRUCTURE_SPAWN
    }

    Memory.energyLogistics.producers['test-producer'] = {
      energy: { current: 300, capacity: 300 },
      pos: { x: 10, y: 10 },
      roomName: 'W1N1',
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      withdrawTiming: { earliestTick: Game.time, latestTick: Game.time + 50 },
      productionPerTick: 1,
      type: STRUCTURE_SPAWN
    }

    // Add a store
    addStoreToEnergyLogistics({
      name: 'test-store',
      energy: { current: 1500, capacity: 2000 },
      pos: { x: 20, y: 20 },
      roomName: 'W1N1',
      structureType: STRUCTURE_CONTAINER
    })

    // Verify other sections are preserved
    expect(Memory.energyLogistics.consumers['test-consumer']).to.exist
    expect(Memory.energyLogistics.producers['test-producer']).to.exist
    expect(Memory.energyLogistics.stores['test-store']).to.exist

    // Verify integrity of other sections
    expect(Memory.energyLogistics.consumers['test-consumer'].type).to.equal(STRUCTURE_SPAWN)
    expect(Memory.energyLogistics.producers['test-producer'].type).to.equal(STRUCTURE_SPAWN)
  })
})
