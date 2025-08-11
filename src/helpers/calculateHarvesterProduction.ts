interface CalculateHarvesterProductionInput {
    carryParts?: number
    sourcePosition: RoomPosition
    spawnPositions: RoomPosition[]
    roadsOnSwamps?: boolean
    roadsOnPlains?: boolean
    workParts?: number
}

interface CalculateHarvesterProductionOutput {
    productionPerTick: number
    returnPath: RoomPosition[]
}

export const calculateHarvesterProduction = ({
    spawnPositions,
    roadsOnSwamps = false,
    roadsOnPlains = false,
    sourcePosition,
    workParts = 1,
    carryParts = 1
}: CalculateHarvesterProductionInput): CalculateHarvesterProductionOutput => {
    const { path: returnPath } = PathFinder.search(
        sourcePosition,
        spawnPositions,
        {
            plainCost: roadsOnPlains ? 1 : 2,
            swampCost: roadsOnSwamps ? 1 : 5.
        }
    )

    const pathLength = returnPath.length
    const roundTripTicks = pathLength * 2

    const harvestAmount = carryParts * 50
    const harvestPerTick = workParts * 2
    const miningTime = Math.ceil(harvestAmount / harvestPerTick)

    const productionPerTick = harvestAmount / (miningTime + roundTripTicks)

    return {
        productionPerTick,
        returnPath,
    }
}