import { expect } from 'chai'
import { addStoreToMemory } from '../../src/logistics/addStoreToEnergyLogistics'
import { ContainerTypes, ControllerContainer, SourceContainer, StoreTypes, StructureName, Urgency } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('addStoreToEnergyLogistics', () => {
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

  it('should add controller container store to energy logistics', () => {
    const storeName: StructureName = 'container_W1N1:25,25'
    addStoreToMemory({
      actions: { collect: 'withdraw', deliver: 'transfer' },
      energy: { current: 1500, capacity: 2000 },
      name: storeName,
      pos: { x: 25, y: 25 },
      roomName: 'W1N1',
      storeType: ControllerContainer as ContainerTypes,
      structureType: STRUCTURE_CONTAINER
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store).to.exist
    expect(store.energy.current).to.equal(1500)
    expect(store.energy.capacity).to.equal(2000)
    expect(store.pos.x).to.equal(25)
    expect(store.pos.y).to.equal(25)
    expect(store.roomName).to.equal('W1N1')
    expect(store.urgency.peace).to.equal(Urgency.HIGH)
    expect(store.urgency.war).to.equal(Urgency.CRITICAL)
    expect(store.type).to.equal(ControllerContainer)
  })

  it('should add storage store to energy logistics', () => {
    const storeName: StructureName = 'storage_test1:30,20'
    addStoreToMemory({
      actions: { collect: 'withdraw', deliver: 'transfer' },
      energy: { current: 50000, capacity: 1000000 },
      name: storeName,
      pos: { x: 30, y: 20 },
      roomName: 'W2N2',
      storeType: STRUCTURE_STORAGE,
      structureType: STRUCTURE_STORAGE
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store).to.exist
    expect(store.energy.current).to.equal(50000)
    expect(store.energy.capacity).to.equal(1000000)
    expect(store.pos.x).to.equal(30)
    expect(store.pos.y).to.equal(20)
    expect(store.roomName).to.equal('W2N2')
    expect(store.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(store.urgency.war).to.equal(Urgency.LOW)
    expect(store.type).to.equal(STRUCTURE_STORAGE)
  })

  it('should add terminal store to energy logistics', () => {
    const storeName: StructureName = 'terminal_test1:15,35'
    addStoreToMemory({
      actions: { collect: 'withdraw', deliver: 'transfer' },
      energy: { current: 75000, capacity: 300000 },
      name: storeName,
      pos: { x: 15, y: 35 },
      roomName: 'W3N3',
      storeType: STRUCTURE_TERMINAL,
      structureType: STRUCTURE_TERMINAL
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store).to.exist
    expect(store.energy.current).to.equal(75000)
    expect(store.energy.capacity).to.equal(300000)
    expect(store.pos.x).to.equal(15)
    expect(store.pos.y).to.equal(35)
    expect(store.roomName).to.equal('W3N3')
    expect(store.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(store.urgency.war).to.equal(Urgency.LOW)
    expect(store.type).to.equal(STRUCTURE_TERMINAL)
  })

  it('should handle empty store capacity', () => {
    const storeName = 'container_W1N1-empty:5,5'
    addStoreToMemory({
      actions: { collect: 'withdraw', deliver: 'transfer' },
      energy: { current: 0, capacity: 0 },
      name: storeName,
      pos: { x: 5, y: 5 },
      roomName: 'W1N1',
      storeType: ControllerContainer as ContainerTypes,
      structureType: STRUCTURE_CONTAINER
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store.energy.current).to.equal(0)
    expect(store.energy.capacity).to.equal(0)
    expect(store.type).to.equal(ControllerContainer)
  })

  it('should handle full store capacity', () => {
    const storeName: StructureName = 'storage_W1N1-full:40,10'
    addStoreToMemory({
      actions: { collect: 'withdraw', deliver: 'transfer' },
      energy: { current: 1000000, capacity: 1000000 },
      name: storeName,
      pos: { x: 40, y: 10 },
      roomName: 'W1N1',
      storeType: STRUCTURE_STORAGE,
      structureType: STRUCTURE_STORAGE
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store.energy.current).to.equal(1000000)
    expect(store.energy.capacity).to.equal(1000000)
    expect(store.type).to.equal(STRUCTURE_STORAGE)
  })

  it('should overwrite existing source container store entry', () => {
    const storeName = 'container_W1N1-empty:5,5'

    addStoreToMemory({
      actions: { collect: 'withdraw', deliver: 'transfer' },
      energy: { current: 1000, capacity: 2000 },
      name: storeName,
      pos: { x: 20, y: 20 },
      roomName: 'W1N1',
      storeType: SourceContainer as ContainerTypes,
      structureType: STRUCTURE_CONTAINER
    })

    // Second add with different values
    addStoreToMemory({
      actions: { collect: 'withdraw', deliver: 'transfer' },
      energy: { current: 50000, capacity: 1000000 },
      name: storeName,
      pos: { x: 25, y: 25 },
      roomName: 'W2N2',
      storeType: STRUCTURE_STORAGE,
      structureType: STRUCTURE_STORAGE
    })

    const store = Memory.energyLogistics.stores[storeName]
    expect(store.energy.current).to.equal(50000)
    expect(store.energy.capacity).to.equal(1000000)
    expect(store.pos.x).to.equal(25)
    expect(store.pos.y).to.equal(25)
    expect(store.roomName).to.equal('W2N2')
    expect(store.type).to.equal(STRUCTURE_STORAGE)
    expect(store.urgency.peace).to.equal(Urgency.MEDIUM)
    expect(store.urgency.war).to.equal(Urgency.LOW)
  })

  it('should handle different room names', () => {
    const stores: {
      name: StructureName
      room: string
    }[] = [
      { name: 'storage_W1N1:5,5', room: 'W1N1' },
      { name: 'storage_W2N2:10,10', room: 'W2N2' },
      { name: 'storage_E5S10:15,15', room: 'E5S10' }
    ]

    stores.forEach(({ name, room }) => {
      addStoreToMemory({
        actions: { collect: 'withdraw', deliver: 'transfer' },
        energy: { current: 1000, capacity: 2000 },
        name,
        pos: { x: 10, y: 10 },
        roomName: room,
        storeType: STRUCTURE_STORAGE,
        structureType: STRUCTURE_STORAGE
      })
    })

    stores.forEach(({ name, room }) => {
      const store = Memory.energyLogistics.stores[name]
      expect(store.roomName).to.equal(room)
    })
  })

  it('should handle edge case positions', () => {
    const testCases: {
      name: StructureName
      pos: { x: number; y: number }
    }[] = [
      { name: 'container_corner1:0,0', pos: { x: 0, y: 0 } },
      { name: 'container_corner2:49,49', pos: { x: 49, y: 49 } },
      { name: 'container_edge1:25,0', pos: { x: 25, y: 0 } },
      { name: 'container_edge2:0,25', pos: { x: 0, y: 25 } }
    ]

    testCases.forEach(({ name, pos }) => {
      addStoreToMemory({
        actions: { collect: 'withdraw', deliver: 'transfer' },
        energy: { current: 500, capacity: 1000 },
        name,
        pos,
        roomName: 'W1N1',
        storeType: ControllerContainer as ContainerTypes,
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
    const storeTypes: {
      structureType: StructureConstant
      storeType: StoreTypes
      expectedPeace: Urgency
      expectedWar: Urgency
    }[] = [
      {
        structureType: STRUCTURE_CONTAINER,
        storeType: SourceContainer as ContainerTypes,
        expectedPeace: Urgency.LOW,
        expectedWar: Urgency.LOW
      },
      {
        structureType: STRUCTURE_CONTAINER,
        storeType: ControllerContainer as ContainerTypes,
        expectedPeace: Urgency.HIGH,
        expectedWar: Urgency.CRITICAL
      },
      {
        structureType: STRUCTURE_STORAGE,
        storeType: STRUCTURE_STORAGE,
        expectedPeace: Urgency.MEDIUM,
        expectedWar: Urgency.LOW
      },
      {
        structureType: STRUCTURE_TERMINAL,
        storeType: STRUCTURE_TERMINAL,
        expectedPeace: Urgency.MEDIUM,
        expectedWar: Urgency.LOW
      }
    ]

    storeTypes.forEach(({ storeType, structureType, expectedPeace, expectedWar }, index) => {
      const storeName = `storage_W1N1:20,20`
      addStoreToMemory({
        actions: { collect: 'withdraw', deliver: 'transfer' },
        energy: { current: 1000, capacity: 2000 },
        name: storeName,
        pos: { x: 20, y: 20 },
        roomName: 'W1N1',
        storeType: storeType,
        structureType: structureType
      })

      const store = Memory.energyLogistics.stores[storeName]
      expect(store.urgency.peace).to.equal(expectedPeace)
      expect(store.urgency.war).to.equal(expectedWar)
    })
  })

  it('should maintain store state across multiple additions', () => {
    const stores: {
      name: StructureName
      type: StructureConstant
    }[] = [
      { name: 'container_W1N1:10,10', type: STRUCTURE_CONTAINER },
      { name: 'storage_W1N1:10,10', type: STRUCTURE_STORAGE },
      { name: 'terminal_W1N1:10,10', type: STRUCTURE_TERMINAL }
    ]

    stores.forEach(({ name, type }) => {
      addStoreToMemory({
        actions: { collect: 'withdraw', deliver: 'transfer' },
        energy: { current: 1000, capacity: 2000 },
        name,
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        storeType: type as ContainerTypes,
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
      const storeName = `container_W1N1:15,15`
      addStoreToMemory({
        actions: { collect: 'withdraw', deliver: 'transfer' },
        energy: { current, capacity },
        name: storeName,
        pos: { x: 15, y: 15 },
        roomName: 'W1N1',
        storeType: SourceContainer as ContainerTypes,
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
    addStoreToMemory({
      actions: { collect: 'withdraw', deliver: 'transfer' },
      energy: { current: 1500, capacity: 2000 },
      name: 'container_W1N1:20,20',
      pos: { x: 20, y: 20 },
      roomName: 'W1N1',
      storeType: SourceContainer as ContainerTypes,
      structureType: STRUCTURE_CONTAINER,
    })

    // Verify other sections are preserved
    expect(Memory.energyLogistics.consumers['test-consumer']).to.exist
    expect(Memory.energyLogistics.producers['test-producer']).to.exist
    expect(Memory.energyLogistics.stores['container_W1N1:20,20']).to.exist

    // Verify integrity of other sections
    expect(Memory.energyLogistics.consumers['test-consumer'].type).to.equal(STRUCTURE_SPAWN)
    expect(Memory.energyLogistics.producers['test-producer'].type).to.equal(STRUCTURE_SPAWN)
  })
})
