import { assert, expect } from "chai"
import { deleteUnusedMemory } from "../../src/deleteUnusedMemory"
import { setupGlobals } from "../helpers/setupGlobals"
import * as sinon from "sinon"
import { CreepRole, EnergyImpactType, Urgency } from "../../src/types"

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

  it("should handle undefined Memory.creeps without errors", () => {
    // Set up some data in other memory sections that should be cleaned up
    Memory.production.energy.orphanedCreep = {
      perTickAmount: 100,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }
    
    // Delete Memory.creeps entirely to test the branch condition
    // @ts-ignore : Allow deleting for testing
    delete Memory.creeps
    
    // Should not throw any errors
    assert.doesNotThrow(() => {
      deleteUnusedMemory()
    })
    
    // The orphaned creep should be cleaned up from production.energy
    assert.isUndefined(Memory.production.energy.orphanedCreep)
  })

  it("should handle missing memory sections without errors", () => {
    Memory.creeps.testCreep = {} as CreepMemory
    
    // Delete some memory sections to test robustness
    // @ts-ignore : Allow deleting for testing
    delete Memory.production
    // @ts-ignore : Allow deleting for testing  
    delete Memory.reservations
    // @ts-ignore : Allow deleting for testing
    delete Memory.energyLogistics

    // Should not throw any errors
    assert.doesNotThrow(() => {
      deleteUnusedMemory()
    })
    
    assert.isUndefined(Memory.creeps.testCreep)
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

  it("should remove creeps from memory sections even if they don't exist in Memory.creeps", () => {
    // Test case where creep exists in other memory sections but not in Memory.creeps
    Memory.production.energy.orphanedCreep = {
      perTickAmount: 100,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }
    
    Memory.reservations.energy.orphanedCreep = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      role: CreepRole.UPGRADER,
      type: EnergyImpactType.CREEP
    }
    
    Memory.reservations.tasks.orphanedCreep = {
      taskId: "task-id",
      type: "harvest",
      sourceId: "source1",
      sourcePosition: { x: 10, y: 10 } as RoomPosition,
      returnPath: [],
      workParts: 2
    }
    
    Memory.energyLogistics.carriers.orphanedCreep = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.MEDIUM, war: Urgency.HIGH },
      decayTiming: { earliestTick: 100, interval: 100, latestTick: 200, threshold: 0 },
      name: "orphanedCreep",
      type: CreepRole.HAULER
    }
    
    Memory.energyLogistics.stores.store1 = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: { orphanedCreep: 50 },
      name: "store1",
      type: "container-source"
    }
    
    // Do not add orphanedCreep to Game.creeps (it's not a living creep)
    
    deleteUnusedMemory()
    
    // All orphaned creep data should be removed
    assert.isUndefined(Memory.production.energy.orphanedCreep)
    assert.isUndefined(Memory.reservations.energy.orphanedCreep)
    assert.isUndefined(Memory.reservations.tasks.orphanedCreep)
    assert.isUndefined(Memory.energyLogistics.carriers.orphanedCreep)
    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations.orphanedCreep)
  })

  it("should handle mixed scenarios with orphaned creeps and regular missing creeps", () => {
    // Regular missing creep (exists in Memory.creeps but not in Game.creeps)
    Memory.creeps.missingCreep = {} as CreepMemory
    Memory.production.energy.missingCreep = {
      perTickAmount: 100,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }
    
    // Orphaned creep (exists in other memory sections but not in Memory.creeps or Game.creeps)
    Memory.reservations.energy.orphanedCreep = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      role: CreepRole.UPGRADER,
      type: EnergyImpactType.CREEP
    }
    
    Memory.energyLogistics.stores.store1 = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: {
        missingCreep: 25,
        orphanedCreep: 30
      },
      name: "store1",
      type: "container-source"
    }
    
    // Living creep (exists in Memory.creeps and Game.creeps)
    Memory.creeps.livingCreep = {} as CreepMemory
    Memory.production.energy.livingCreep = {
      perTickAmount: 200,
      roomNames: ["W1N1"],
      role: CreepRole.HARVESTER,
      type: EnergyImpactType.CREEP
    }
    Memory.energyLogistics.stores.store1.reservations.livingCreep = 40
    
    Game.creeps.livingCreep = {} as Creep
    
    deleteUnusedMemory()
    
    // Missing and orphaned creeps should be removed
    assert.isUndefined(Memory.creeps.missingCreep)
    assert.isUndefined(Memory.production.energy.missingCreep)
    assert.isUndefined(Memory.reservations.energy.orphanedCreep)
    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations.missingCreep)
    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations.orphanedCreep)
    
    // Living creep should remain
    assert.isDefined(Memory.creeps.livingCreep)
    assert.isDefined(Memory.production.energy.livingCreep)
    assert.isDefined(Memory.energyLogistics.stores.store1.reservations.livingCreep)
  })

  // Structure cleanup tests
  it("should delete production energy data for missing structures", () => {
    const structureId = "5a2b4b85a0b39e5b" // Real structure ID format
    Memory.production.energy[structureId] = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      type: EnergyImpactType.SPAWN
    }

    // Do not add structure to Game.rooms, so it's considered missing
    Game.rooms['W1N1'].find = sinon.stub().returns([])

    deleteUnusedMemory()

    assert.isUndefined(Memory.production.energy[structureId])
  })

  it("should delete energy reservations for missing structures", () => {
    const structureId = "5a2b4b85a0b39e5c" // Real structure ID format
    Memory.reservations.energy[structureId] = {
      perTickAmount: 75,
      roomNames: ["W1N1"],
      type: EnergyImpactType.CONTAINERS
    }

    // Do not add structure to Game.rooms, so it's considered missing
    Game.rooms['W1N1'].find = sinon.stub().returns([])

    deleteUnusedMemory()

    assert.isUndefined(Memory.reservations.energy[structureId])
  })

  it("should delete energy logistics consumers for missing structures", () => {
    const structureId = "5a2b4b85a0b39e5d" // Real structure ID format
    Memory.energyLogistics.consumers[structureId] = {
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

    assert.isUndefined(Memory.energyLogistics.consumers[structureId])
  })

  it("should delete energy logistics producers for missing structures", () => {
    const structureId = "5a2b4b85a0b39e5e" // Real structure ID format
    Memory.energyLogistics.producers[structureId] = {
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

    assert.isUndefined(Memory.energyLogistics.producers[structureId])
  })

  it("should delete energy logistics stores for missing structures", () => {
    const structureId = "5a2b4b85a0b39e5f" // Real structure ID format
    Memory.energyLogistics.stores[structureId] = {
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

    assert.isUndefined(Memory.energyLogistics.stores[structureId])
  })

  it("should delete store reservations for missing structures", () => {
    const missingStructureId = "5a2b4b85a0b39e60" // Real structure ID format
    const existingStructureId = "5a2b4b85a0b39e61" // Real structure ID format
    
    Memory.energyLogistics.stores.store1 = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: { 
        [missingStructureId]: 25,
        [existingStructureId]: 30
      },
      name: "store1",
      type: "container-source"
    }

    // Add existingStructure to Game.rooms but not missingStructure
    const mockStructure = { id: existingStructureId } as Structure
    Game.rooms['W1N1'].find = sinon.stub().returns([mockStructure])

    deleteUnusedMemory()

    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations[missingStructureId])
    assert.isDefined(Memory.energyLogistics.stores.store1.reservations[existingStructureId])
  })

  it("should not delete memory for structures that still exist", () => {
    const structureId = "5a2b4b85a0b39e62" // Real structure ID format
    Memory.production.energy[structureId] = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      type: EnergyImpactType.SPAWN
    }
    Memory.reservations.energy[structureId] = {
      perTickAmount: 75,
      roomNames: ["W1N1"],
      type: EnergyImpactType.CONTAINERS
    }
    Memory.energyLogistics.consumers[structureId] = {
      energy: { current: 100, capacity: 300 },
      pos: { x: 15, y: 20 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 5,
      type: STRUCTURE_SPAWN
    }
    Memory.energyLogistics.producers[structureId] = {
      energy: { current: 200, capacity: 300 },
      pos: { x: 25, y: 30 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      withdrawTiming: { earliestTick: 50, latestTick: 150 },
      productionPerTick: 10,
      type: STRUCTURE_SPAWN
    }
    Memory.energyLogistics.stores[structureId] = {
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
    const mockStructure = { id: structureId } as Structure
    Game.rooms['W1N1'].find = sinon.stub().returns([mockStructure])

    deleteUnusedMemory()

    assert.isDefined(Memory.production.energy[structureId])
    assert.isDefined(Memory.reservations.energy[structureId])
    assert.isDefined(Memory.energyLogistics.consumers[structureId])
    assert.isDefined(Memory.energyLogistics.producers[structureId])
    assert.isDefined(Memory.energyLogistics.stores[structureId])
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
    const missingStructure = "5a2b4b85a0b39e63" // Real structure ID format
    const existingCreep = "existingCreep"
    const existingStructure = "5a2b4b85a0b39e64" // Real structure ID format

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
    const orphanedStructureId = "5a2b4b85a0b39e65" // Real structure ID format
    
    // Test case where structure exists in memory sections but not in Game.rooms
    Memory.production.energy[orphanedStructureId] = {
      perTickAmount: 50,
      roomNames: ["W1N1"],
      type: EnergyImpactType.SPAWN
    }
    
    Memory.reservations.energy[orphanedStructureId] = {
      perTickAmount: 75,
      roomNames: ["W1N1"],
      type: EnergyImpactType.CONTAINERS
    }
    
    Memory.energyLogistics.consumers[orphanedStructureId] = {
      energy: { current: 100, capacity: 300 },
      pos: { x: 15, y: 20 },
      roomName: "W1N1",
      urgency: { peace: Urgency.HIGH, war: Urgency.HIGH },
      depositTiming: { earliestTick: 100, latestTick: 200 },
      productionPerTick: 5,
      type: STRUCTURE_SPAWN
    }
    
    Memory.energyLogistics.stores.store1 = {
      energy: { current: 50, capacity: 100 },
      pos: { x: 10, y: 10 },
      roomName: "W1N1",
      urgency: { peace: Urgency.LOW, war: Urgency.LOW },
      actions: { collect: "withdraw", deliver: "transfer" },
      reservations: { [orphanedStructureId]: 50 },
      name: "store1",
      type: "container-source"
    }
    
    // Do not add orphanedStructure to Game.rooms (it doesn't exist)
    Game.rooms['W1N1'].find = sinon.stub().returns([])
    
    deleteUnusedMemory()
    
    // All orphaned structure data should be removed
    assert.isUndefined(Memory.production.energy[orphanedStructureId])
    assert.isUndefined(Memory.reservations.energy[orphanedStructureId])
    assert.isUndefined(Memory.energyLogistics.consumers[orphanedStructureId])
    assert.isUndefined(Memory.energyLogistics.stores.store1.reservations[orphanedStructureId])
  })
})
