import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { findFreeAdjacentPositions } from '../../src/findFreeAdjacentPositions'
import { mockGame, mockMemory } from './mock'
import { convertPositionToTerrainIndex } from '../../src/conversions'
import { ROOM_GRID_COUNT, TerrainTypeArray } from 'types'

describe('findFreeAdjacentPositions', () => {

  beforeEach(() => {
    // @ts-ignore
    global.Game = { ...mockGame }
    // @ts-ignore
    global.Memory = { ...mockMemory }
    // @ts-ignore
    global.TERRAIN_MASK_WALL = 1
    // @ts-ignore
    global.RoomPosition = function(x, y, roomName) {
      return { x, y, roomName }
    }
  })

  it('should return all 8 adjacent positions if all are walkable', () => {
    // @ts-ignore "Type instantiation is excessively deep and possibly infinite."
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray // all plain
    const roomPosition = new RoomPosition(13, 13, 'W1N1')
    const result = findFreeAdjacentPositions({ roomPosition, terrainArray })
    expect(result).to.have.length(8)
    // Check that all returned positions are adjacent
    for (const pos of result) {
      expect(Math.abs(pos.x - roomPosition.x)).to.be.at.most(1)
      expect(Math.abs(pos.y - roomPosition.y)).to.be.at.most(1)
      expect(pos.x === roomPosition.x && pos.y === roomPosition.y).to.be.false
      expect(pos.roomName).to.equal('W1N1')
    }
  })

  it('should not return center position', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    const roomPosition = new RoomPosition(10, 10, 'W1N1')
    const result = findFreeAdjacentPositions({ roomPosition, terrainArray })
    expect(result.some(pos => pos.x === 10 && pos.y === 10)).to.be.false
  })

  it('should not return positions that are walls', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    // Set (11,10) and (10,11) as walls
    // @ts-ignore
    terrainArray[convertPositionToTerrainIndex({ x: 11, y: 10 })] = 1
    // @ts-ignore
    terrainArray[convertPositionToTerrainIndex({ x: 10, y: 11 })] = 1
    const roomPosition = new RoomPosition(10, 10, 'W1N1')
    const result = findFreeAdjacentPositions({ roomPosition, terrainArray })
    expect(result.some(pos => (pos.x === 11 && pos.y === 10) || (pos.x === 10 && pos.y === 11))).to.be.false
  })

  it('should return an empty array if terrainArray is invalid', () => {
    const roomPosition = new RoomPosition(10, 10, 'W1N1')
    expect(findFreeAdjacentPositions({ roomPosition, terrainArray: [] })).to.deep.equal([])
    expect(findFreeAdjacentPositions({ roomPosition, terrainArray: new Array(10).fill(0) as TerrainTypeArray })).to.deep.equal([])
  })

  it('should handle edge positions (not out of bounds)', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    const roomPosition = new RoomPosition(0, 0, 'W1N1')
    const result = findFreeAdjacentPositions({ roomPosition, terrainArray })
    // Only 3 valid adjacent positions for (0,0): (1,0), (0,1), (1,1)
    expect(result).to.have.length(3)
    expect(result).to.deep.include.members([
      new RoomPosition(1, 0, 'W1N1'),
      new RoomPosition(0, 1, 'W1N1'),
      new RoomPosition(1, 1, 'W1N1')
    ])
  })
})
