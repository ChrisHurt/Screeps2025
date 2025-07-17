import { assert } from "chai"
import { createMapGraph } from "../../src/createMapGraph"
import { mockGame, mockMemory, ExitsInformation } from "./mock"

describe("createMapGraph", () => {
  beforeEach(() => {
    // @ts-ignore Test setup
    global.Game = Object.assign({}, mockGame)
    // @ts-ignore Test setup
    global.Memory = Object.assign({}, mockMemory) as Memory
  })

  it("should create an empty graph when there are no rooms", () => {
    Game.rooms = {}

    createMapGraph()

    assert.deepEqual(Memory.mapRoomGraph, {})
  })

  it("should create a graph with no exits for a single room with no exits", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }
    Game.map.describeExits = (roomName: string) => ({} as ExitsInformation)
    createMapGraph()

    assert.deepEqual(Memory.mapRoomGraph, { "W1N1": [] })
  })

  it("should create a graph with exits for a room with exits in all directions", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }
    Game.map.describeExits = (roomName: string) => ({
      "1": "W1N2",  // top
      "3": "W2N1",  // right
      "5": "W1N0",  // bottom
      "7": "W0N1"   // left
    } as ExitsInformation)

    createMapGraph()

    const exitRooms = Memory.mapRoomGraph["W1N1"]
    assert.isArray(exitRooms)
    assert.lengthOf(exitRooms, 4)

    const validExits = ["W1N2", "W2N1", "W1N0", "W0N1"]
    for (const room of exitRooms) {
      assert.include(validExits, room)
    }
  })

  it("should create a graph with partial exits when some directions have no exits", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }
    Game.map.describeExits = (roomName: string) => ({
      "1": "W1N2",  // top
      "7": "W0N1"   // left
    } as ExitsInformation)

    createMapGraph()

    const exitRooms = Memory.mapRoomGraph["W1N1"]
    assert.isArray(exitRooms)
    assert.lengthOf(exitRooms, 2)
    assert.include(exitRooms, "W1N2")
    assert.include(exitRooms, "W0N1")
  })

  it("should create a graph for multiple rooms", () => {
    Game.rooms = {
      "W1N1": { name: "W1N1" } as Room,
      "W2N2": { name: "W2N2" } as Room
    }
    Game.map.describeExits = (roomName: string) => {
      if (roomName === "W1N1") {
        return { "3": "W2N1" } as ExitsInformation
      } else if (roomName === "W2N2") {
        return { "5": "W2N1" } as ExitsInformation
      }
      return {} as ExitsInformation
    }

    createMapGraph()

    const w1n1Exits = Memory.mapRoomGraph["W1N1"]
    const w2n2Exits = Memory.mapRoomGraph["W2N2"]
    
    assert.isArray(w1n1Exits)
    assert.isArray(w2n2Exits)
    
    assert.lengthOf(w1n1Exits, 1)
    assert.lengthOf(w2n2Exits, 1)
    
    assert.equal(w1n1Exits[0], "W2N1")
    assert.equal(w2n2Exits[0], "W2N1")
  })

  it("should handle undefined exits", () => {
    Game.rooms = { "W1N1": { name: "W1N1" } as Room }
    Game.map.describeExits = (roomName: string) => ({
      "1": undefined,
      "3": "W2N1",
      "5": undefined,
      "7": "W0N1"
    } as ExitsInformation)

    createMapGraph()

    const exitRooms = Memory.mapRoomGraph["W1N1"]
    assert.isArray(exitRooms)
    assert.lengthOf(exitRooms, 2)
    assert.include(exitRooms, "W2N1")
    assert.include(exitRooms, "W0N1")
  })
})
