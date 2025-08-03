import { assert } from "chai"
import { createMapConnections } from "../../src/createMapConnections"
import { ExitsInformation } from "../helpers/mock"
import { setupGlobals } from "../helpers/setupGlobals"

describe("createMapConnections", () => {
  beforeEach(() => {
    setupGlobals()
  })

  it("should do nothing when there are no rooms", () => {
    createMapConnections()

    assert.deepEqual(Memory.mapConnections, [])
    assert.deepEqual(Memory.mapRoomGraph, {})
  })

  it("should create connections for a single room with no exits", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }
    Game.map.describeExits = (roomName: string) => ({} as ExitsInformation)

    createMapConnections()

    assert.deepEqual(Memory.mapConnections, [])
    assert.deepEqual(Memory.mapRoomGraph, { "W1N1": [] })
  })

  it("should create connections for a room with exits in all directions", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }
    Game.map.describeExits = (roomName: string) => {
      if (roomName === "W1N1") {
        return {
          "1": "W1N2",  // top
          "3": "W2N1",  // right
          "5": "W1N0",  // bottom
          "7": "W0N1"   // left
        } as ExitsInformation
      }
      // For rooms that are discovered during traversal
      return {} as ExitsInformation
    }

    createMapConnections()

    // Should have 4 connections (W1N1-W0N1, W1N1-W1N0, W1N1-W1N2, W1N1-W2N1)
    assert.equal(Memory.mapConnections.length, 4)

    // Verify all expected connections exist
    const expectedConnections = [
      "W0N1-W1N1",
      "W1N0-W1N1",
      "W1N1-W1N2",
      "W1N1-W2N1"
    ]

    for (const connection of expectedConnections) {
      assert.include(Memory.mapConnections, connection, `Connection ${connection} should exist`)
    }

    // Verify mapRoomGraph was updated correctly
    assert.deepEqual(Memory.mapRoomGraph["W1N1"], ["W1N2", "W2N1", "W1N0", "W0N1"])
  })

  it("should create connections for multiple interconnected rooms", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }

    Game.map.describeExits = (roomName: string) => {
      if (roomName === "W1N1") {
        return { "3": "E1N1", "7": "W2N1" } as ExitsInformation
      } else if (roomName === "E1N1") {
        return { "5": "W1N1" } as ExitsInformation
      } else if (roomName === "W2N1") {
        return { "5": "W3N1", "3": "W1N1" } as ExitsInformation
      } else if (roomName === "W3N1") {
        return { "1": "W2N1", "5": "W3S1" } as ExitsInformation
      } else if (roomName === "W3S1") {
        return { "5": "W3N1" } as ExitsInformation
      }
      return {} as ExitsInformation
    }

    createMapConnections()

    assert.equal(Memory.mapConnections.length, 4)
    assert.include(Memory.mapConnections, "E1N1-W1N1")
    assert.include(Memory.mapConnections, "W1N1-W2N1")
    assert.include(Memory.mapConnections, "W2N1-W3N1")
    assert.include(Memory.mapConnections, "W3N1-W3S1")

    // Verify mapRoomGraph entries
    assert.deepEqual(Memory.mapRoomGraph["W1N1"], ["E1N1","W2N1"])
    assert.deepEqual(Memory.mapRoomGraph["E1N1"], ["W1N1"])
    assert.deepEqual(Memory.mapRoomGraph["W2N1"], ["W1N1","W3N1"])
    assert.deepEqual(Memory.mapRoomGraph["W3N1"], ["W2N1","W3S1"])
    assert.deepEqual(Memory.mapRoomGraph["W3S1"], ["W3N1"])
  })

  it("should handle undefined exits", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }
    Game.map.describeExits = (roomName: string) => {
        return roomName === "W1N1" ? {
            "1": undefined,
            "3": "W2N1",
            "5": undefined,
            "7": "W0N1"
            }
            : {}
    }

    createMapConnections()

    assert.equal(Memory.mapConnections.length, 2)
    assert.include(Memory.mapConnections, "W0N1-W1N1")
    assert.include(Memory.mapConnections, "W1N1-W2N1")
  })

  it("should handle rooms with circular connections", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }

    // Mocking a square circular connection scenario
    Game.map.describeExits = (roomName: string) => {
      if (roomName === "W1N1") {
        return { "3": "E1N1", "5": "W1S1" } as ExitsInformation
      } else if (roomName === "E1N1") {
        return { "5": "E1S1", "7": "W1N1" } as ExitsInformation
      } else if (roomName === "E1S1") {
        return { "1": "E1N1", "7": "W1S1" } as ExitsInformation
      } else if (roomName === "W1S1") {
        return { "1": "W1N1", "3": "E1S1" } as ExitsInformation
      }
      return {} as ExitsInformation
    }

    createMapConnections()

    // Should have 4 unique connections
    assert.equal(Memory.mapConnections.length, 4)

    const expectedConnections = [
        "E1N1-W1N1",
        "W1N1-W1S1",
        "E1N1-E1S1",
        "E1S1-W1S1",
    ]

    for (const connection of expectedConnections) {
      assert.include(Memory.mapConnections, connection)
    }
  })
})
