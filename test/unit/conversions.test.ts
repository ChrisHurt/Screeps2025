import { describe, beforeEach, it } from 'mocha';
import { expect } from 'chai';
const _ = require('lodash');
import { convertPositionToTerrainIndex, convertTerrainIndexToPosition } from "../../src/conversions";
import { Position } from "../../src/types";
import { mockGame, mockMemory } from "./mock";

describe("conversions", () => {
  beforeEach(() => {
    // Set up mock globals before each test
    // @ts-ignore : allow adding Game to global
    global.Game = _.clone(mockGame)
    // @ts-ignore : allow adding Memory to global
    global.Memory = _.clone(mockMemory)
  })

  describe("convertPositionToTerrainIndex", () => {
    it("should convert a Position object to the correct terrain index", () => {
      const position: Position = { x: 5, y: 10 }
      const index = convertPositionToTerrainIndex(position)
      expect(index).to.equal(229); // (10-1) * 25 + (5-1)
    })

    it("should convert a RoomPosition object to the correct terrain index", () => {
      // Create a mock RoomPosition object
      const roomPosition = {
        x: 15,
        y: 20,
        roomName: "W1N1"
      } as RoomPosition

      const index = convertPositionToTerrainIndex(roomPosition)
      expect(index).to.equal(489); // (20-1) * 25 + (15-1)
    })

    it("should handle boundary values correctly", () => {
      // Test top-left corner
      expect(convertPositionToTerrainIndex({ x: 1, y: 1 })).to.equal(0);

      // Test bottom-right corner (assuming a 50x50 room)
      expect(convertPositionToTerrainIndex({ x: 25, y: 25 })).to.equal(624); // (25-1) * 25 + (25-1)
    })
  })

  describe("convertTerrainIndexToPosition", () => {
    it("should convert a terrain index to the correct Position object", () => {
      const index = 10 * 25 + 5 // Equivalent to x=5, y=10
      const position = convertTerrainIndexToPosition(index)

      expect(position).to.deep.equal({ x: 6, y: 11 }); // Adding 1 to match function implementation
    })

    it("should handle zero index correctly", () => {
      const position = convertTerrainIndexToPosition(0)
      expect(position).to.deep.equal({ x: 1, y: 1 });
    })

    it("should handle maximum index correctly", () => {
      // For the 25x25 grid, the maximum index is 624
      const position = convertTerrainIndexToPosition(624)
      expect(position).to.deep.equal({ x: 25, y: 25 });
    })

    it("should handle arbitrary indices correctly", () => {
        expect(convertTerrainIndexToPosition(0)).to.deep.equal({ x: 1, y: 1 });
        expect(convertTerrainIndexToPosition(26)).to.deep.equal({ x: 2, y: 2 });
        expect(convertTerrainIndexToPosition(51)).to.deep.equal({ x: 2, y: 3 });
        expect(convertTerrainIndexToPosition(100)).to.deep.equal({ x: 1, y: 5 });
        expect(convertTerrainIndexToPosition(624)).to.deep.equal({ x: 25, y: 25 });
    })

    it("should produce positions that can be converted back to the original index", () => {
      // Test roundtrip conversion
      for (let i = 0; i < 625; i += 25) {
        const position = convertTerrainIndexToPosition(i)
        // Adjust the position values to match the expected input for convertPositionToTerrainIndex
        const reconvertedIndex = convertPositionToTerrainIndex(position)
        expect(reconvertedIndex).to.equal(i);
      }
    })
  })
})
