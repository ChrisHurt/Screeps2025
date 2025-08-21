
interface calculateBuilderProductionInput {
    creepBody: BodyPartConstant[]
    path: RoomPosition[]
}

export const calculateBuilderProduction = ({
    creepBody,
    path,
}: calculateBuilderProductionInput): number => {
    const pathLength = path.length
    const roundTripTicks = pathLength * 2

    const { carryCapacity, workParts } = creepBody.reduce(
        (acc, part) => {
            if (part === CARRY) acc.carryCapacity += 50
            if (part === WORK) acc.workParts += 1
            return acc
        },
        { carryCapacity: 0, workParts: 0 }
    )

    if (workParts === 0 || carryCapacity === 0) {
        return 0
    }

    const buildTicks = Math.ceil(carryCapacity / (workParts * 2))

    const productionPerTick = carryCapacity / (buildTicks + roundTripTicks)

    return productionPerTick
}