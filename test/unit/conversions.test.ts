import { describe, beforeEach, it } from 'mocha'
import { expect } from 'chai'
const _ = require('lodash')
import { convertPositionToTerrainIndex, convertTerrainIndexToPosition } from "../../src/conversions"
import { Position, ROOM_GRID_COUNT } from "../../src/types"
import { setupGlobals } from '../helpers/setupGlobals'

describe("conversions", () => {
  beforeEach(() => {
    setupGlobals()
  })

  describe("convertPositionToTerrainIndex", () => {
    it("should convert a Position object to the correct terrain index", () => {
      const position: Position = { x: 5, y: 10 }
      const index = convertPositionToTerrainIndex(position)
      expect(index).to.equal(505) // 10 * 50 + 5
    })

    it("should convert a RoomPosition object to the correct terrain index", () => {
      // Create a mock RoomPosition object
      const roomPosition = {
        x: 15,
        y: 20,
        roomName: "W1N1"
      } as RoomPosition

      const index = convertPositionToTerrainIndex(roomPosition)
      expect(index).to.equal(1015) // 20 * 50 + 15
    })

    it("should handle boundary values correctly", () => {
      // Test top-left corner
      expect(convertPositionToTerrainIndex({ x: 0, y: 0 })).to.equal(0)

      // Test bottom-right corner (assuming a 50x50 room)
      expect(convertPositionToTerrainIndex({ x: 49, y: 49 })).to.equal(2499) // 49 * 50 + 49
    })
  })

  describe("convertTerrainIndexToPosition", () => {
    it("should convert a terrain index to the correct Position object", () => {
      const index = 10 * 50 + 5 // Equivalent to x=5, y=10
      const position = convertTerrainIndexToPosition(index)

      expect(position).to.deep.equal({ x: 5, y: 10 })
    })

    it("should produce positions that can be converted back to the original index", () => {
      // Test roundtrip conversion
      for (let i = 0; i < ROOM_GRID_COUNT; i += 1) {
        const position = convertTerrainIndexToPosition(i)
        // Adjust the position values to match the expected input for convertPositionToTerrainIndex
        const reconvertedIndex = convertPositionToTerrainIndex(position)
        expect(reconvertedIndex).to.equal(i)
      }
    })
  })
})
