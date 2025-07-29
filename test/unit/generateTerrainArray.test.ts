import { describe, beforeEach, it } from 'mocha';
import { expect } from 'chai';
const _ = require('lodash');
import { generateTerrainArray } from "../../src/generateTerrainArray";
import { mockGame, mockMemory } from "./mock";
import { convertPositionToTerrainIndex } from "../../src/conversions";

describe("generateTerrainArray", () => {
  beforeEach(() => {
    // Set up mock globals before each test
    // @ts-ignore : allow adding Game to global
    global.Game = _.clone(mockGame)
    // @ts-ignore : allow adding Memory to global
    global.Memory = _.clone(mockMemory)
  })

  describe("when room is available", () => {
    it("should generate a terrain array for a valid room", () => {
      // Create a mock terrain with known values
      const mockTerrain = {
        get: (x: number, y: number) => {
            const type = x=== 10 && y === 10 ? 1 : x === 15 && y === 15 ? 2 : 0
          // Return 0 (plain) for most terrain, 1 (wall) for specific positions, 2 for swamp
          return type
        }
      }

      // Create a mock room with the mock terrain
      const mockRoom = {
        getTerrain: () => mockTerrain
      } as unknown as Room

      // Set the mock room in Game.rooms
      Game.rooms.W1N1 = mockRoom

      // Generate terrain array
      const terrainArray = generateTerrainArray("W1N1")

      // Verify it's an array of the correct length
      expect(terrainArray.length).to.equal(625);

      // Check specific positions to ensure they match our mock terrain
      const wallIndex = convertPositionToTerrainIndex({ x: 10, y: 10 })
      const swampIndex = convertPositionToTerrainIndex({ x: 15, y: 15 })
      const plainIndex = convertPositionToTerrainIndex({ x: 5, y: 5 })

      expect(terrainArray[wallIndex]).to.equal(1);
      expect(terrainArray[swampIndex]).to.equal(2);
      expect(terrainArray[plainIndex]).to.equal(0);
    })
  })

  describe("when room is not available", () => {
    it("should return an empty array if room is not found", () => {
      // Ensure the room doesn't exist
      delete Game.rooms.W1N1

      // Generate terrain array for non-existent room
      const terrainArray = generateTerrainArray("W1N1")

      // Verify it's an empty array
      expect(terrainArray).to.deep.equal([]);
    })
  })

  describe("when terrain is not available", () => {
    it("should return an empty array if terrain is not found", () => {
      // Create a mock room with no terrain
      const mockRoom = {
        getTerrain: () => null
      } as unknown as Room

      // Set the mock room in Game.rooms
      Game.rooms.W1N1 = mockRoom

      // Generate terrain array
      const terrainArray = generateTerrainArray("W1N1")

      // Verify it's an empty array
      expect(terrainArray).to.deep.equal([]);
    })
  })
})
