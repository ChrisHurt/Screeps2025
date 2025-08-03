import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { singleSourceShortestPaths } from '../../src/singleSourceShortestPath'
import { ROOM_GRID_COUNT, TerrainTypeArray } from 'types'
import { convertPositionToTerrainIndex } from 'conversions'
import { setupGlobals } from '../helpers/setupGlobals'

describe('singleSourceShortestPaths', () => {
  beforeEach(() => {
    setupGlobals()
  })

  it('should return the starting point if only one', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    const startingPoints = [new RoomPosition(5, 5, 'W1N1')]
    const result = singleSourceShortestPaths({ startingPoints, terrainArray })
    expect(result).to.deep.equal([{ x: 5, y: 5 }])
  })

  it('should prefer interpolated positions between two starting points', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    const startingPoints = [
      new RoomPosition(1, 1, 'W1N1'),
      new RoomPosition(25, 25, 'W1N1')
    ]
    const result = singleSourceShortestPaths({ startingPoints, terrainArray })
    expect(result).to.deep.equal([
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
        { x: 5, y: 5 },
        { x: 6, y: 6 },
        { x: 7, y: 7 },
        { x: 8, y: 8 },
        { x: 9, y: 9 },
        { x: 10, y: 10 },
        { x: 11, y: 11 },
        { x: 12, y: 12 },
        { x: 13, y: 13 },
        { x: 14, y: 14 },
        { x: 15, y: 15 },
        { x: 16, y: 16 },
        { x: 17, y: 17 },
        { x: 18, y: 18 },
        { x: 19, y: 19 },
        { x: 20, y: 20 },
        { x: 21, y: 21 },
        { x: 22, y: 22 },
        { x: 23, y: 23 },
        { x: 24, y: 24 },
        { x: 25, y: 25 }
    ])
  })

  it('should avoid walls', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    // Set a wall at (13,13)
    // @ts-ignore
    terrainArray[convertPositionToTerrainIndex({ x: 13, y: 13 })] = 1
    const startingPoints = [
      new RoomPosition(1, 1, 'W1N1'),
      new RoomPosition(25, 25, 'W1N1')
    ]
    const result = singleSourceShortestPaths({ startingPoints, terrainArray })
    // Should not return the wall position
    expect(result).to.not.include({ x: 13, y: 13 })
    expect(result).to.deep.equal([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 7, y: 6 },
      { x: 6, y: 7 },
      { x: 7, y: 7 },
      { x: 8, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 9 },
      { x: 9, y: 9 },
      { x: 10, y: 9 },
      { x: 9, y: 10 },
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 11 },
      { x: 11, y: 11 },
      { x: 12, y: 11 },
      { x: 11, y: 12 },
      { x: 12, y: 12 },
      { x: 13, y: 12 },
      { x: 12, y: 13 },
      { x: 14, y: 13 },
      { x: 13, y: 14 },
      { x: 14, y: 14 },
      { x: 15, y: 14 },
      { x: 14, y: 15 },
      { x: 15, y: 15 },
      { x: 16, y: 15 },
      { x: 15, y: 16 },
      { x: 16, y: 16 },
      { x: 17, y: 16 },
      { x: 16, y: 17 },
      { x: 17, y: 17 },
      { x: 18, y: 17 },
      { x: 17, y: 18 },
      { x: 18, y: 18 },
      { x: 19, y: 18 },
      { x: 18, y: 19 },
      { x: 19, y: 19 },
      { x: 20, y: 19 },
      { x: 19, y: 20 },
      { x: 20, y: 20 },
      { x: 21, y: 20 },
      { x: 20, y: 21 },
      { x: 21, y: 21 },
      { x: 22, y: 21 },
      { x: 21, y: 22 },
      { x: 22, y: 22 },
      { x: 23, y: 22 },
      { x: 22, y: 23 },
      { x: 23, y: 23 },
      { x: 24, y: 23 },
      { x: 23, y: 24 },
      { x: 24, y: 24 },
      { x: 25, y: 24 },
      { x: 24, y: 25 },
      { x: 25, y: 25 }
    ])
  })

  it('should triangulate between 3 starting points', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    const startingPoints = [
      new RoomPosition(5, 5, 'W1N1'),
      new RoomPosition(15, 25, 'W1N1'),
      new RoomPosition(25, 15, 'W1N1'),
    ]
    const result = singleSourceShortestPaths({
      startingPoints,
      terrainArray,
    })

    expect(result).to.deep.equal([
      { x: 20, y: 20 },
    ])
  })

  it('should exclude starting points if specified', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    const startingPoints = [
      new RoomPosition(1, 1, 'W1N1'),
      new RoomPosition(3, 3, 'W1N1'),
    ]
    const result = singleSourceShortestPaths({
      startingPoints,
      terrainArray,
      excludeStartingPoints: true
    })
    expect(result).to.not.include({ x: 1, y: 1 })
    expect(result).to.not.include({ x: 3, y: 3 })
    expect(result).to.deep.equal([
      { x: 2, y: 2 },
    ])
  })

  it('should exclude adjacent positions if specified', () => {
    const terrainArray = new Array(ROOM_GRID_COUNT).fill(0) as TerrainTypeArray
    const startingPoints = [
      new RoomPosition(1, 1, 'W1N1'),
      new RoomPosition(3, 3, 'W1N1'),
    ]
    const result = singleSourceShortestPaths({
      startingPoints,
      terrainArray,
      excludeAdjacent: true
    })

    expect(result).to.not.include({ x: 2, y: 2 })
    expect(result).to.deep.equal([
      { x: 1, y: 1 },
      { x: 3, y: 3 },
    ])
  })
})
