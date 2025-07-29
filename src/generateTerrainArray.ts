import { convertTerrainIndexToPosition } from "conversions"
import { TerrainTypeArray } from "types"

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

    return Array(625).fill(0).map((_, index) => {
        const {
            x,y
        } = convertTerrainIndexToPosition(index)
        const type = terrain.get(x, y)
        return type
    }) as TerrainTypeArray
}