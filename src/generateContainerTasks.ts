import { addStoreToEnergyLogistics } from "helpers/logistics/addStoreToEnergyLogistics"
import { ContainerTypes, ControllerContainer, RoomBuildTask, SourceContainer } from "types"

interface GenerateContainerTasks {
    room: Room,
    roomMemory: RoomMemory,
    roadsOnPlains?: boolean,
    roadsOnSwamps?: boolean,
}

export const generateContainerTasks = ({
    room,
    roomMemory,
    roadsOnPlains,
    roadsOnSwamps
}: GenerateContainerTasks): void => {
    if (!roomMemory.tasks) return
    if (roomMemory.tasks.harvest.length === 0) return
    if (!roomMemory.tasks.upgrade) return

    // NOTE: This is triggered after the first spawn is built
    const startingSpawnPosition = room.find(FIND_MY_SPAWNS)[0]?.pos

    if (!startingSpawnPosition) {
        console.log(`GenerateContainerTasks: No spawn found in room ${room.name}`)
        return
    }

    // TODO: Add recycle container

    roomMemory.structures = roomMemory.structures || { containers: { sources: {} } }

    const sourceContainerPositions = roomMemory.tasks.harvest.reduce<RoomPosition[]>((acc, harvestTask) => {
        const pathCalculation = PathFinder.search(
            startingSpawnPosition,
            harvestTask.availablePositions,
            {
                plainCost: roadsOnPlains ? 1 : 2,
                swampCost: roadsOnSwamps ? 1 : 5
            }
        )

        if (pathCalculation.incomplete) {
            console.log(`GenerateContainerTasks: Incomplete path for source ${harvestTask.sourceId} in room ${harvestTask.roomName}`)
        }

        const containerPosition =
            pathCalculation.path.length > 1
            ? pathCalculation.path[pathCalculation.path.length - 2]
            : pathCalculation.path[pathCalculation.path.length - 1]
        acc.push(containerPosition)


        roomMemory.structures!.containers.sources![harvestTask.sourceId] = {
            position: containerPosition,
            repairDuringSiege: false,
            path: pathCalculation.path,
            structureType: STRUCTURE_CONTAINER
        }

        return acc
    },[])

    const upgradeTask = roomMemory.tasks.upgrade

    const pathCalculation = PathFinder.search(
        startingSpawnPosition,
        upgradeTask.availablePositions,
        {
            plainCost: roadsOnPlains ? 1 : 2,
            swampCost: roadsOnSwamps ? 1 : 5
        }
    )

    if (pathCalculation.incomplete) {
        console.log(`GenerateContainerTasks: Incomplete path for controller ${upgradeTask.controllerId} in room ${upgradeTask.roomName}`)
        return
    }

    const controllerContainerPosition = pathCalculation.path.length > 1
        ? pathCalculation.path[pathCalculation.path.length - 2]
        : pathCalculation.path[pathCalculation.path.length - 1]

    roomMemory.structures.containers.controller = {
        position: controllerContainerPosition,
        repairDuringSiege: false,
        path: pathCalculation.path,
        structureType: STRUCTURE_CONTAINER
    }

    sourceContainerPositions.forEach(position => {
        addStoreToEnergyLogistics({
            actions: { collect: 'withdraw', deliver: 'transfer' },
            energy: {
                current: 0,
                capacity: 0
            },
            name: `SourceContainer_${position.x},${position.y}`,
            pos: position,
            roomName: room.name,
            structureType: SourceContainer as ContainerTypes
        })
    })
    addStoreToEnergyLogistics({
        actions: { collect: 'withdraw', deliver: 'transfer' },
        energy: {
            current: 0,
            capacity: 0
        },
        name: `ControllerContainer_${controllerContainerPosition.x},${controllerContainerPosition.y}`,
        pos: controllerContainerPosition,
        roomName: room.name,
        structureType: ControllerContainer as ContainerTypes
    })

    // Generate container build tasks
    const containerTasks: RoomBuildTask[] = [
        ...sourceContainerPositions,
        controllerContainerPosition,
    ].map(position => {

        // Add Construction site
        room.createConstructionSite(position, STRUCTURE_CONTAINER)

        return {
            buildParams: {
                position,
                repairDuringSiege: false,
                path: pathCalculation.path,
                structureType: STRUCTURE_CONTAINER
            },
            roomName: room.name,
            reservingCreeps: {}
        }
    })

    roomMemory.tasks.build.push(...containerTasks)
}
