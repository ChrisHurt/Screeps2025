import { convertPositionToTerrainIndex, convertTerrainIndexToPosition } from "helpers/conversions"
import { findFreeAdjacentPositions } from "findFreeAdjacentPositions"
import { Position, ROOM_GRID_COUNT, ROOM_SIZE, TERRAIN_MASK_PLAIN, TerrainDistanceArray, TerrainTypeArray } from "types"

interface SingleSourceShortestPathParams {
    excludeStartingPoints?: boolean
    excludeAdjacent?: boolean
    startingPoints: RoomPosition[]
    terrainArray: TerrainTypeArray | []
}

export const singleSourceShortestPaths = ({
    excludeStartingPoints = false,
    excludeAdjacent = false,
    startingPoints,
    terrainArray
}: SingleSourceShortestPathParams): Position[] => {
    const terrainDistances: TerrainDistanceArray[] = startingPoints.map(start => floodfillDistances(terrainArray, start, startingPoints))
    const terrainDistanceSum: TerrainDistanceArray = terrainDistances.reduce<TerrainDistanceArray>(function (distancesSum: TerrainDistanceArray, terrainDistance: TerrainDistanceArray): TerrainDistanceArray {
        return distancesSum.map<number>((value, index) => {
            return value + terrainDistance[index]
        }) as TerrainDistanceArray
    }, new Array(ROOM_GRID_COUNT).fill(0) as TerrainDistanceArray)

    const minimumSumDistance = Math.min(...terrainDistanceSum)

    const excludedIndices: Set<number> = startingPoints.reduce<Set<number>>((set, startPos) => {
        const startIndex = convertPositionToTerrainIndex(startPos)
        excludeStartingPoints && set.add(startIndex)

        if(excludeAdjacent) {
            const adjacentPositions = findFreeAdjacentPositions({
                roomPosition: new RoomPosition(startPos.x, startPos.y, startPos.roomName),
                terrainArray
            })

            adjacentPositions.map(pos => convertPositionToTerrainIndex(pos)).forEach(index => {
                set.add(index)
            })
        }

        return set
    }, new Set<number>())

    // Return all positions with minimumSumDistance and not excluded
    const optimumSpawnLocationIndices = terrainDistanceSum
        .map((distance, index) => ({ distance, index }))
        .filter(({ distance, index }) => distance === minimumSumDistance && !excludedIndices.has(index))
        .map(({ index }) => index)

    return optimumSpawnLocationIndices.map(convertTerrainIndexToPosition)
}

const floodfillDistances = (terrainArray: TerrainTypeArray, start: Position, requiredPositions: RoomPosition[]): TerrainDistanceArray => {
    const distances: number[] = new Array(ROOM_GRID_COUNT).fill(Infinity) as TerrainDistanceArray
    const queue: Position [] = []
    const startIndex = convertPositionToTerrainIndex(start)
    distances[startIndex] = 0
    queue.push(start)

    // Track which required positions have been touched
    const requiredIndices = new Set<number>(requiredPositions.map(convertPositionToTerrainIndex))
    const touchedIndices = new Set<number>()

    while (queue.length > 0) {
        // Exit early if all required positions have been touched
        if (touchedIndices.size === requiredIndices.size) break

        const currentPosition = queue.shift()!
        const currentIndex = convertPositionToTerrainIndex(currentPosition)

        // Mark as touched if it's a required position
        if (requiredIndices.has(currentIndex)) {
            touchedIndices.add(currentIndex)
        }

        const currentDistance = distances[currentIndex]
        const currentTerrainType = terrainArray[currentIndex]

        for (const dx of [-1, 0, 1]) {
            for (const dy of [-1, 0, 1]) {
                if (dx === 0 && dy === 0) continue // Skip the current position

                const nx = currentPosition.x + dx
                const ny = currentPosition.y + dy

                if (nx < 0 || nx >= ROOM_SIZE || ny < 0 || ny >= ROOM_SIZE) continue // Out of bounds

                const neighborIndex = convertPositionToTerrainIndex({ x: nx, y: ny })
                const neighbourTerrainType = terrainArray[neighborIndex]

                // NOTE: The neighbour terrain must not be a wall
                if (neighbourTerrainType === TERRAIN_MASK_WALL) continue // Skip walls

                // NOTE: The current terrain is used to determine the weight of the path
                const newDistance = currentDistance + TERRAIN_WEIGHTS[currentTerrainType]

                // NOTE: If the neighbour hasn't been visited, add it to the queue
                if(distances[neighborIndex] === Infinity) {
                    queue.push({ x: nx, y: ny })
                }

                // NOTE: If the new distance is less than the current distance, update it
                // This ensures that we always have the shortest path to each position
                if (newDistance < distances[neighborIndex]) {
                    distances[neighborIndex] = newDistance
                }
            }
        }
    }

    return distances as TerrainDistanceArray
}

const SWAMP_WEIGHT = 5
const PLAIN_WEIGHT = 1
const WALL_WEIGHT = Infinity

const TERRAIN_WEIGHTS: Record<TERRAIN_MASK_PLAIN | TERRAIN_MASK_WALL | TERRAIN_MASK_SWAMP, number> = [
    PLAIN_WEIGHT, // TERRAIN_MASK_PLAIN
    WALL_WEIGHT,  // TERRAIN_MASK_WALL
    SWAMP_WEIGHT, // TERRAIN_MASK_SWAMP
]