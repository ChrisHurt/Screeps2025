import { Position, TERRAIN_MASK_PLAIN, TerrainDistanceArray, TerrainTypeArray } from "types"

interface SingleSourceShortestPathParams {
    startingPoints: Position[]
    terrainArray: TerrainTypeArray | []
}

export const singleSourceShortestPaths = ({
    startingPoints,
    terrainArray
}: SingleSourceShortestPathParams): Position => {
    const terrainDistances: TerrainDistanceArray[] = startingPoints.map(start => terrainArray.length === 625 ? singleSourceShortestPath(terrainArray, start) : new Array(625).fill(Infinity) as TerrainDistanceArray)
    const terrainDistanceSum: TerrainDistanceArray = terrainDistances.reduce<TerrainDistanceArray>(function (distancesSum: TerrainDistanceArray, terrainDistance: TerrainDistanceArray): TerrainDistanceArray {
        return distancesSum.map((value, index) => value + terrainDistance[index]) as TerrainDistanceArray
    }, new Array(625).fill(0) as TerrainDistanceArray)

    const minimumSumDistance = Math.min(...terrainDistanceSum)
    const optimumSpawnLocationIndex = terrainDistanceSum.findIndex(distance => distance === minimumSumDistance)

    return {
        x: (optimumSpawnLocationIndex % 25) + 1,
        y: Math.floor(optimumSpawnLocationIndex / 25) + 1,
    }
}

const singleSourceShortestPath = (terrainArray: TerrainTypeArray, start: Position): TerrainDistanceArray => {
    const distances: TerrainDistanceArray = new Array(625).fill(Infinity) as TerrainDistanceArray
    const queue: Position [] = []

    distances[(start.y - 1) * 25 + (start.x - 1)] = 0
    queue.push(start)

    while (queue.length > 0) {
        const current = queue.shift()!
        const currentIndex = (current.y - 1) * 25 + (current.x - 1)

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                // if (Math.abs(dx) === Math.abs(dy)) continue // Skip diagonals

                const nx = current.x + dx
                const ny = current.y + dy

                if (nx < 1 || nx > 25 || ny < 1 || ny > 25) continue // Out of bounds

                const neighborIndex = (ny - 1) * 25 + (nx - 1)

                const terrainType = terrainArray[neighborIndex]
                if (terrainType === TERRAIN_MASK_WALL) continue // Skip walls

                const newDistance = distances[currentIndex] + TERRAIN_WEIGHTS[terrainType]

                if (newDistance < distances[neighborIndex]) {
                    distances[neighborIndex] = newDistance
                    queue.push({ x: nx, y: ny })
                }
            }
        }
    }

    return distances
}

const SWAMP_WEIGHT = 5
const PLAIN_WEIGHT = 1
const WALL_WEIGHT = Infinity

const TERRAIN_WEIGHTS: Record<TERRAIN_MASK_PLAIN | TERRAIN_MASK_WALL | TERRAIN_MASK_SWAMP, number> = [
    PLAIN_WEIGHT, // TERRAIN_MASK_PLAIN
    WALL_WEIGHT,  // TERRAIN_MASK_WALL
    SWAMP_WEIGHT, // TERRAIN_MASK_SWAMP
]