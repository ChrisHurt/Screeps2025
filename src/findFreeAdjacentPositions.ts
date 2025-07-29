import { convertPositionToTerrainIndex } from "conversions"
import { Position, TerrainTypeArray } from "types"

interface FindFreeAdjacentPositionsParams {
  roomPosition: RoomPosition
  terrainArray: TerrainTypeArray | []
}

export const findFreeAdjacentPositions = ({
  roomPosition: {
    x,
    y,
    roomName
  },
  terrainArray
}: FindFreeAdjacentPositionsParams): RoomPosition[] => {

  if (!terrainArray || terrainArray.length !== 625) {
    console.error(`Invalid terrainArray provided for room ${roomName}. Expected length 625, got ${terrainArray.length}.`)
    return []
  }

  const freeRoomPositions: RoomPosition[] = []

  for(let dx: -1|0|1 = -1; dx <= 1; dx++) {
    for(let dy: -1|0|1 = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue // Skip the center position
      const terrainIndex = convertPositionToTerrainIndex({
        x: x + dx,
        y: y + dy
      })

      const terrain = terrainArray[terrainIndex]
      const terrainIsWalkable = terrain !== TERRAIN_MASK_WALL
      if (terrainIsWalkable) {
        freeRoomPositions.push(
          new RoomPosition(
            x + dx,
            y + dy,
            roomName
          )
        )
      }
    }
  }

  return freeRoomPositions
}