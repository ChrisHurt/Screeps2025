
interface calculateUpgraderProductionInput {
    carryParts: number
    controllerPosition: RoomPosition
    roadsOnPlains?: boolean
    roadsOnSwamps?: boolean
    spawnPositions: RoomPosition[]
    workParts: number
}

interface CalculateUpgraderProductionOutput {
    productionPerTick: number
    returnPath: RoomPosition[]
}

export const calculateUpgraderProduction = ({
    carryParts,
    controllerPosition,
    roadsOnPlains = false,
    roadsOnSwamps = false,
    spawnPositions,
    workParts
}: calculateUpgraderProductionInput): CalculateUpgraderProductionOutput => {
    const { path: returnPath } = PathFinder.search(
        controllerPosition,
        spawnPositions,
        {
            plainCost: roadsOnPlains ? 1 : 2,
            swampCost: roadsOnSwamps ? 1 : 5
        }
    )
    const pathLength = returnPath.length
    const roundTripTicks = pathLength * 2

    const carryCapacity = carryParts * 50

    const upgradeTicks = Math.ceil(carryCapacity / (workParts * 2))

    const productionPerTick = carryCapacity / (upgradeTicks + roundTripTicks)

    return {
        productionPerTick,
        returnPath
    }
}