import { convertPositionToTerrainIndex } from "conversions"
import { Position, ROOM_GRID_COUNT, ROOM_SIZE, TerrainTypeArray } from "types"

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

  if (!terrainArray || terrainArray.length !== ROOM_GRID_COUNT) {
    console.log(`Invalid terrainArray provided for room ${roomName}. Expected length ROOM_GRID_COUNT, got ${terrainArray.length}.`)
    return []
  }

  const freeRoomPositions: RoomPosition[] = []

  for(let dx: -1|0|1 = -1; dx <= 1; dx++) {
    for(let dy: -1|0|1 = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue // Skip the center position
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= ROOM_SIZE || ny < 0 || ny >= ROOM_SIZE) continue // Skip out of bounds
      const terrainIndex = convertPositionToTerrainIndex({
        x: nx,
        y: ny
      })

      const terrain = terrainArray[terrainIndex]
      const terrainIsWalkable = terrain !== TERRAIN_MASK_WALL
      if (terrainIsWalkable) {
        freeRoomPositions.push(
          new RoomPosition(
            nx,
            ny,
            roomName
          )
        )
      }
    }
  }

  return freeRoomPositions
}