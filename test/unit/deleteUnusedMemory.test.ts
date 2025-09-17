import { assert, expect } from "chai"
import { deleteUnusedMemory } from "../../src/memory/deleteUnusedMemory"
import { setupGlobals } from "../helpers/setupGlobals"
import * as sinon from "sinon"
import { CreepRole, EnergyImpactType, StructureName, Urgency } from "../../src/types"

describe("deleteUnusedMemory", () => {
  beforeEach(() => {
    setupGlobals()

    // Setup Game.rooms with find method for structures
    Game.rooms = {
      'W1N1': {
        find: sinon.stub().returns([])
      }
    } as any
  })

  afterEach(() => {
    sinon.restore()
  })

  it("should delete memory of missing creeps", () => {
    // @ts-ignore : Permit invalid memory for testing
    Memory.creeps.persistValue = "any value"
    // @ts-ignore : Permit invalid memory for testing
    Memory.creeps.notPersistValue = "any value"

    // @ts-ignore : allow adding Game to global
    Game.creeps.persistValue = "any value"

    deleteUnusedMemory()

    assert.isDefined(Memory.creeps.persistValue)
    assert.isUndefined(Memory.creeps.notPersistValue)
  })

  it("should delete production energy data for missing creeps", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.production.energy.testCreep = {
      perTickAmount: 100,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }

    // Do not add testCreep to Game.creeps, so it's considered missing

    deleteUnusedMemory()

    assert.isUndefined(Memory.creeps.testCreep)
    assert.isUndefined(Memory.production.energy.testCreep)
  })

  it("should delete energy reservations for missing creeps", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.reservations.energy.testCreep = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      role: CreepRole.UPGRADER,
      type: EnergyImpactType.CREEP
    }

    // Do not add testCreep to Game.creeps, so it's considered missing

    deleteUnusedMemory()

    assert.isUndefined(Memory.creeps.testCreep)
    assert.isUndefined(Memory.reservations.energy.testCreep)
  })

  it("should delete task reservations for missing creeps", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.reservations.tasks.testCreep = {
      taskId: "some-task-id",
      type: "harvest",
      sourceId: "source1",
      sourcePosition: { x: 10, y: 10 } as RoomPosition,
      returnPath: [],
      workParts: 2
    }

    // Do not add testCreep to Game.creeps, so it's considered missing

    deleteUnusedMemory()

    assert.isUndefined(Memory.creeps.testCreep)
    assert.isUndefined(Memory.reservations.tasks.testCreep)
  })

  it("should delete energy logistics carriers for missing creeps", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.energyLogistics.carriers.testCreep = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.HIGH },
      decayTiming: { earliestTick: 100, interval: 100, latestTick: 200, threshold: 0 },
      name: "testCreep",
      type: CreepRole.HAULER
    }

    // Do not add testCreep to Game.creeps, so it's considered missing

    deleteUnusedMemory()

    assert.isUndefined(Memory.creeps.testCreep)
    assert.isUndefined(Memory.energyLogistics.carriers.testCreep)
  })

  it("should delete store reservations for missing creeps", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.energyLogistics.stores.store1 = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: { testCreep: 50 },
      name: "store1",
      type: "container-source"
    }
    Memory.energyLogistics.stores.store2 = {
      energy: { current: 75, capacity: 100 },
      pos: { x: 20, y: 20 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: { testCreep: 25, otherCreep: 30 },
      name: "store2",
      type: STRUCTURE_STORAGE
    }

    // Add otherCreep to Game.creeps but not testCreep
    Game.creeps.otherCreep = {} as Creep

    deleteUnusedMemory()

    assert.isUndefined(Memory.creeps.testCreep)
    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations.testCreep)
    assert.isUndefined(Memory.energyLogistics.stores.store2.reservations.testCreep)
    assert.isDefined(Memory.energyLogistics.stores.store2.reservations.otherCreep)
  })

  it("should not delete memory for creeps that still exist", () => {
    Memory.creeps.existingCreep = {} as CreepMemory
    Memory.production.energy.existingCreep = {
      perTickAmount: 100,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }
    Memory.reservations.energy.existingCreep = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      role: CreepRole.UPGRADER,
      type: EnergyImpactType.CREEP
    }
    Memory.reservations.tasks.existingCreep = {
      taskId: "task-id",
      type: "harvest",
      sourceId: "source1",
      sourcePosition: { x: 10, y: 10 } as RoomPosition,
      returnPath: [],
      workParts: 2
    }
    Memory.energyLogistics.carriers.existingCreep = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.HIGH },
      decayTiming: { earliestTick: 100, interval: 100, latestTick: 200, threshold: 0 },
      name: "existingCreep",
      type: CreepRole.HAULER
    }
    Memory.energyLogistics.stores.store1 = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: { existingCreep: 50 },
      name: "store1",
      type: "container-source"
    }

    // Add the creep to Game.creeps so it exists
    Game.creeps.existingCreep = {} as Creep

    deleteUnusedMemory()

    assert.isDefined(Memory.creeps.existingCreep)
    assert.isDefined(Memory.production.energy.existingCreep)
    assert.isDefined(Memory.reservations.energy.existingCreep)
    assert.isDefined(Memory.reservations.tasks.existingCreep)
    assert.isDefined(Memory.energyLogistics.carriers.existingCreep)
    assert.isDefined(Memory.energyLogistics.stores.store1.reservations.existingCreep)
  })

  it("should handle empty Memory.creeps without errors", () => {
    Memory.creeps = {}
    
    // Should not throw any errors
    assert.doesNotThrow(() => {
      deleteUnusedMemory()
    })
  })

  it("should handle empty energyLogistics.stores without errors", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.energyLogistics.stores = {}

    // Should not throw any errors
    assert.doesNotThrow(() => {
      deleteUnusedMemory()
    })

    assert.isUndefined(Memory.creeps.testCreep)
  })

  it("should handle stores without reservations property", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.energyLogistics.stores.store1 = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      name: "store1",
      type: "container-source"
      // Note: no reservations property
    } as any

    // Should not throw any errors
    assert.doesNotThrow(() => {
      deleteUnusedMemory()
    })
    
    assert.isUndefined(Memory.creeps.testCreep)
  })

  it("should delete multiple missing creeps correctly", () => {
    Memory.creeps.missingCreep1 = {} as CreepMemory
    Memory.creeps.missingCreep2 = {} as CreepMemory 
    Memory.creeps.existingCreep = {} as CreepMemory
    
    Memory.production.energy.missingCreep1 = {
      perTickAmount: 100,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }
    Memory.production.energy.missingCreep2 = {
      perTickAmount: 150,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }
    Memory.production.energy.existingCreep = {
      perTickAmount: 200,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }
    
    Memory.energyLogistics.stores.store1 = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: {
        missingCreep1: 25,
        missingCreep2: 30,
        existingCreep: 50
      },
      name: "store1",
      type: "container-source"
    }

    // Only add existingCreep to Game.creeps
    Game.creeps.existingCreep = {} as Creep

    deleteUnusedMemory()

    // Missing creeps should be deleted
    assert.isUndefined(Memory.creeps.missingCreep1)
    assert.isUndefined(Memory.creeps.missingCreep2)
    assert.isUndefined(Memory.production.energy.missingCreep1)
    assert.isUndefined(Memory.production.energy.missingCreep2)
    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations.missingCreep1)
    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations.missingCreep2)
    
    // Existing creep should remain
    assert.isDefined(Memory.creeps.existingCreep)
    assert.isDefined(Memory.production.energy.existingCreep)
    assert.isDefined(Memory.energyLogistics.stores.store1.reservations.existingCreep)
  })

  // Structure cleanup tests
  it("should delete production energy data for missing structures", () => {
    const structureName: StructureName = "spawn_W1N1:23,21"
    Memory.structures[structureName] = {
      name: structureName,
      pos: { x: 23, y: 21 },
      roomName:  "W1N1",
      type: STRUCTURE_SPAWN
    }
    Memory.production.energy[structureName] = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      type: EnergyImpactType.SPAWN
    }

    // Do not add structure to Game.rooms, so it's considered missing
    Game.rooms['W1N1'].find = sinon.stub().returns([])

    deleteUnusedMemory()

    assert.isUndefined(Memory.production.energy[structureName])
  })

  it("should delete energy reservations for missing structures", () => {
    const structureName: StructureName = "spawn_W1N1:23,21"
    Memory.structures[structureName] = {
      name: structureName,
      pos: { x: 23, y: 21 },
      roomName:  "W1N1",
      type: STRUCTURE_SPAWN
    }
    Memory.reservations.energy[structureName] = {
      perTickAmount: 75,
      roomNames: ["W1N1"],
      type: EnergyImpactType.CONTAINERS
    }

    // Do not add structure to Game.rooms, so it's considered missing
    Game.rooms['W1N1'].find = sinon.stub().returns([])

    deleteUnusedMemory()

    assert.isUndefined(Memory.reservations.energy[structureName])
  })

  it("should delete energy logistics consumers for missing structures", () => {
    const structureName: StructureName = "spawn_W1N1:15,20"
    Memory.structures[structureName] = {
      name: structureName,
      pos: { x: 15, y: 20 },
      roomName:  "W1N1",
      type: STRUCTURE_SPAWN
    }
    Memory.energyLogistics.consumers[structureName] = {
      energy: { current: 100, capacity: 300 },
      pos: { x: 15, y: 20 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 5,
      type: STRUCTURE_SPAWN
    }

    // Do not add structure to Game.rooms, so it's considered missing
    Game.rooms['W1N1'].find = sinon.stub().returns([])

    deleteUnusedMemory()

    assert.isUndefined(Memory.energyLogistics.consumers[structureName])
  })

  it("should delete energy logistics producers for missing structures", () => {
    const structureName: StructureName = "spawn_W1N1:25,30"
    Memory.structures[structureName] = {
      name: structureName,
      pos: { x: 25, y: 30 },
      roomName:  "W1N1",
      type: STRUCTURE_SPAWN
    }
    Memory.energyLogistics.producers[structureName] = {
      energy: { current: 200, capacity: 300 },
      pos: { x: 25, y: 30 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      withdrawTiming: { earliestTick: 50, latestTick: 150 },
      productionPerTick: 10,
      type: STRUCTURE_SPAWN
    }

    // Do not add structure to Game.rooms, so it's considered missing
    Game.rooms['W1N1'].find = sinon.stub().returns([])

    deleteUnusedMemory()

    assert.isUndefined(Memory.energyLogistics.producers[structureName])
  })

  it("should delete energy logistics stores for missing structures", () => {
    const structureName = "storage_W1N1:35,40"
    Memory.structures[structureName] = {
      name: structureName,
      pos: { x: 35, y: 40 },
      roomName:  "W1N1",
      type: STRUCTURE_STORAGE
    }
    Memory.energyLogistics.stores[structureName] = {
      energy: { current: 150, capacity: 2000 },
      pos: { x: 35, y: 40 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: {},
      name: "store202",
      type: STRUCTURE_STORAGE
    }

    // Do not add structure to Game.rooms, so it's considered missing
    Game.rooms['W1N1'].find = sinon.stub().returns([])

    deleteUnusedMemory()

    assert.isUndefined(Memory.energyLogistics.stores[structureName])
  })

  it("should delete store reservations for missing creeps", () => {
    const missingCreepName = "missingCreep"
    const existingCreepName = "existingCreep"
    const existingStoreName = "storage_W1N1:50,50"
    const existingStoreId = "5a2b4b85a0b39e62"

    Memory.creeps[missingCreepName] = {} as CreepMemory
    Memory.creeps[existingCreepName] = {} as CreepMemory

    Game.structures[existingStoreId] = {
      id: existingStoreId,
      structureType: STRUCTURE_STORAGE,
      pos: { x: 50, y: 50, roomName: "W1N1" },
      room: {
        name: "W1N1",
      }
    } as StructureStorage

    Memory.structures[existingStoreName] = {
      name: existingStoreName,
      pos: { x: 50, y: 50 },
      roomName:  "W1N1",
      type: STRUCTURE_STORAGE
    }

    Memory.energyLogistics.stores[existingStoreName] = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: {
        [missingCreepName]: 25,
        [existingCreepName]: 30
      },
      name: existingStoreName,
      type: STRUCTURE_STORAGE
    }

    // Add existingCreep to Game.creeps but not missingCreep
    Game.creeps[existingCreepName] = {} as Creep

    deleteUnusedMemory()

    assert.isUndefined(Memory.creeps[missingCreepName])
    assert.isDefined(Memory.energyLogistics.stores[existingStoreName].reservations[existingCreepName])
    assert.isUndefined(Memory.energyLogistics.stores[existingStoreName].reservations[missingCreepName])
  })

  it("should not delete memory for structures that still exist", () => {
    const structureName = "5a2b4b85a0b39e62"
    Memory.production.energy[structureName] = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      type: EnergyImpactType.SPAWN
    }
    Memory.reservations.energy[structureName] = {
      perTickAmount: 75,
      roomNames: ["W1N1"],
      type: EnergyImpactType.CONTAINERS
    }
    Memory.energyLogistics.consumers[structureName] = {
      energy: { current: 100, capacity: 300 },
      pos: { x: 15, y: 20 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 5,
      type: STRUCTURE_SPAWN
    }
    Memory.energyLogistics.producers[structureName] = {
      energy: { current: 200, capacity: 300 },
      pos: { x: 25, y: 30 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      withdrawTiming: { earliestTick: 50, latestTick: 150 },
      productionPerTick: 10,
      type: STRUCTURE_SPAWN
    }
    Memory.energyLogistics.stores[structureName] = {
      energy: { current: 150, capacity: 2000 },
      pos: { x: 35, y: 40 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: {},
      name: "existingStructure",
      type: STRUCTURE_STORAGE
    }

    // Add the structure to Game.rooms so it exists
    const mockStructure = { id: structureName } as Structure
    Game.rooms['W1N1'].find = sinon.stub().returns([mockStructure])

    deleteUnusedMemory()

    assert.isDefined(Memory.production.energy[structureName])
    assert.isDefined(Memory.reservations.energy[structureName])
    assert.isDefined(Memory.energyLogistics.consumers[structureName])
    assert.isDefined(Memory.energyLogistics.producers[structureName])
    assert.isDefined(Memory.energyLogistics.stores[structureName])
  })

  it("should delete energy logistics consumers for missing creeps", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.energyLogistics.consumers.testCreep = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 2,
      type: CreepRole.BUILDER
    }

    // Do not add testCreep to Game.creeps, so it's considered missing

    deleteUnusedMemory()

    assert.isUndefined(Memory.creeps.testCreep)
    assert.isUndefined(Memory.energyLogistics.consumers.testCreep)
  })

  it("should delete energy logistics producers for missing creeps", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    Memory.energyLogistics.producers.testCreep = {
      energy: { current: 75, capacity: 100 },
      pos: { x: 15, y: 15 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.MEDIUM },
      withdrawTiming: { earliestTick: 50, latestTick: 150 },
      productionPerTick: 10,
      type: CreepRole.HARVESTER
    }

    // Do not add testCreep to Game.creeps, so it's considered missing

    deleteUnusedMemory()

    assert.isUndefined(Memory.creeps.testCreep)
    assert.isUndefined(Memory.energyLogistics.producers.testCreep)
  })

  it("should handle mixed creep and structure cleanup", () => {
    const missingCreep = "missingCreep"
    const missingStructure = "spawn_W1N1:15,20"
    const existingCreep = "existingCreep"
    const existingStructure = "extension_W1N1:25,30"

    Game.creeps[existingCreep] = {} as Creep
    Game.structures[existingStructure] = {
      id: existingStructure,
      structureType: STRUCTURE_EXTENSION,
      pos: { x: 25, y: 30, roomName: "W1N1" },
      room: {
        name: "W1N1",
      }
    } as StructureExtension

    Memory.structures[missingStructure] = {
      name: missingStructure,
      pos: { x: 15, y: 20 },
      roomName:  "W1N1",
      type: STRUCTURE_SPAWN
    }
    Memory.structures[existingStructure] = {
      name: existingStructure,
      pos: { x: 25, y: 30 },
      roomName:  "W1N1",
      type: STRUCTURE_EXTENSION
    }

    // Set up memory for missing entities
    Memory.creeps[missingCreep] = {} as CreepMemory
    Memory.energyLogistics.consumers[missingCreep] = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 2,
      type: CreepRole.BUILDER
    }
    Memory.energyLogistics.consumers[missingStructure] = {
      energy: { current: 100, capacity: 300 },
      pos: { x: 15, y: 20 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 5,
      type: STRUCTURE_SPAWN
    }

    // Set up memory for existing entities
    Memory.creeps[existingCreep] = {} as CreepMemory
    Memory.energyLogistics.consumers[existingCreep] = {
      energy: { current: 60, capacity: 100 },
      pos: { x: 20, y: 20 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 3,
      type: CreepRole.UPGRADER
    }
    Memory.energyLogistics.consumers[existingStructure] = {
      energy: { current: 150, capacity: 300 },
      pos: { x: 25, y: 30 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 8,
      type: STRUCTURE_EXTENSION
    }

    // Add existing entities to Game
    Game.creeps[existingCreep] = {} as Creep
    const mockStructure = { id: existingStructure } as Structure
    Game.rooms['W1N1'].find = sinon.stub().returns([mockStructure])

    deleteUnusedMemory()

    // Missing entities should be removed
    assert.isUndefined(Memory.creeps[missingCreep])
    assert.isUndefined(Memory.energyLogistics.consumers[missingCreep])
    assert.isUndefined(Memory.energyLogistics.consumers[missingStructure])

    // Existing entities should remain
    assert.isDefined(Memory.creeps[existingCreep])
    assert.isDefined(Memory.energyLogistics.consumers[existingCreep])
    assert.isDefined(Memory.energyLogistics.consumers[existingStructure])
  })

  it("should remove structures from memory sections even if they don't exist in Game.rooms", () => {
    const orphanedStructureName = "spawn_W1N1:15,20"

    Memory.structures[orphanedStructureName] = {
      name: orphanedStructureName,
      pos: { x: 15, y: 20 },
      roomName:  "W1N1",
      type: STRUCTURE_SPAWN
    }

    // Test case where structure exists in memory sections but not in Game.rooms
    Memory.production.energy[orphanedStructureName] = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      type: EnergyImpactType.SPAWN
    }

    Memory.reservations.energy[orphanedStructureName] = {
      perTickAmount: 75,
      roomNames: ["W1N1"],
      type: EnergyImpactType.CONTAINERS
    }

    Memory.energyLogistics.consumers[orphanedStructureName] = {
      energy: { current: 100, capacity: 300 },
      pos: { x: 15, y: 20 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 5,
      type: STRUCTURE_SPAWN
    }

    Memory.energyLogistics.stores[orphanedStructureName] = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: { [orphanedStructureName]: 50 },
      name: "store1",
      type: "container-source"
    }

    // Do not add orphanedStructure to Game.rooms (it doesn't exist)
    Game.rooms['W1N1'].find = sinon.stub().returns([])

    deleteUnusedMemory()

    // All orphaned structure data should be removed
    assert.isUndefined(Memory.production.energy[orphanedStructureName])
    assert.isUndefined(Memory.reservations.energy[orphanedStructureName])
    assert.isUndefined(Memory.energyLogistics.consumers[orphanedStructureName])
    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations[orphanedStructureName])
  })
})
