import { convertTerrainIndexToPosition } from "conversions"
import { ROOM_GRID_COUNT, TerrainTypeArray } from "types"

// @ts-ignore "Type instantiation is excessively deep and possibly infinite."
export const generateTerrainArray = (roomName: string): TerrainTypeArray | [] => {
    const room = Game.rooms[roomName]

    if (!room) {
        console.log(`GenerateTerrainArrayError: Room ${roomName} not found in Game.rooms`)
        return []
    }

    const terrain = room.getTerrain()

    if (!terrain) {
        console.log(`GenerateTerrainArrayError: No terrain found for room ${roomName}`)
        return []
    }


    return Array(ROOM_GRID_COUNT).fill(0).map((_, index) => {
        const {
            x,y
        } = convertTerrainIndexToPosition(index)
        const type = terrain.get(x, y)
        return type
    }) as TerrainTypeArray
}