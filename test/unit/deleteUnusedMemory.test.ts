import { assert, expect } from "chai"
import { deleteUnusedMemory } from "../../src/deleteUnusedMemory"
import { setupGlobals } from "../helpers/setupGlobals"
import * as sinon from "sinon"
import { CreepRole, EnergyImpactType, Urgency } from "../../src/types"

describe("deleteUnusedMemory", () => {
  beforeEach(() => {
    setupGlobals()
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
})
