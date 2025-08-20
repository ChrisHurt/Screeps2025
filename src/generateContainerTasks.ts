import { RoomBuildTask } from "types"

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

    // NOTE: This is triggered before the second spawn is built
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
        } else {
            acc.push(pathCalculation.path[pathCalculation.path.length - 1])
        }

            roomMemory.structures!.containers.sources![harvestTask.sourceId] = {
                position: pathCalculation.path[pathCalculation.path.length - 1],
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

    const controllerContainerPosition = pathCalculation.path[pathCalculation.path.length - 1]

    roomMemory.structures.containers.controller = {
        position: controllerContainerPosition,
        repairDuringSiege: false,
        path: pathCalculation.path,
        structureType: STRUCTURE_CONTAINER
    }

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

// //   const tasks: RoomBuildTask[] = []
//     const sources = room.find(FIND_SOURCES).map(source=>source.pos)
//     const controllerPos = room.controller?.pos
//     const startingSpawnPos = room.find(FIND_MY_SPAWNS)[0]?.pos




//     // Given the starting spawn position is known
//     // Floodfill from spawn until sources and controller are covered

//   for (const source of sources) {
//     // Calculate path to nearest spawn from the source
//     const spawn = room.find(FIND_MY_SPAWNS)[0]
//     if (!spawn) return

//     const path = PathFinder.search(source.pos, { pos: spawn.pos, range: 1 })
//     if (!path.incomplete) {
//       const containerPosition = path.path[0]
//       tasks.push({
//         type: "build",
//         target: containerPosition,
//         priority: 5
//       })
//     }
//   }