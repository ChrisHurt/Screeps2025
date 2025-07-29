import { ReservingCreeps } from "types"

export const spawnCreeps = () => {
    const rooms = Game.rooms

    for (const roomName in rooms) {
        const spawnsReserved: string[] = []
        const room = rooms[roomName]
        const roomMemory = Memory.rooms[roomName]

        if(!room) {
            console.log(`SpawnCreepsError: Room ${roomName} not found in Game.rooms`)
            continue
        }

        if (!roomMemory) {
            console.log(`SpawnCreepsError: No memory found for room ${roomName}`)
            continue
        }

        const roomTasks = roomMemory.tasks

        if (!roomTasks) {
            console.log(`SpawnCreepsDebug: No tasks found for room ${roomName}`)
            continue
        }

        const harvestTasks = roomTasks.harvest
        for (const harvestTask of harvestTasks) {
            const reservedWorkParts = Object.values(harvestTask.reservingCreeps).reduce((total,creep) => total+creep.workParts,0)
            const requiredWorkParts = harvestTask.requiredWorkParts
            const availablePositionsCount = harvestTask.availablePositions.length

            const livingReservingCreeps = getIntersection(
                Object.keys(harvestTask.reservingCreeps),
                Object.keys(Game.creeps)
            )

            harvestTask.reservingCreeps = livingReservingCreeps.reduce<ReservingCreeps>((acc, creepName) => {
                if(livingReservingCreeps.includes(creepName)) {
                    acc[creepName] = harvestTask.reservingCreeps[creepName]
                }
                return acc
            }, {})


            const workersAreNeeded = requiredWorkParts - reservedWorkParts > 0
            const roomIsAvailable = livingReservingCreeps.length < availablePositionsCount

            const shouldSpawnHarvesters = workersAreNeeded && roomIsAvailable

            console.log(`SpawnCreepsDebug: Room ${roomName} - Harvest Task ${harvestTask.sourceId}: Workers Needed: ${workersAreNeeded}, Room Available: ${roomIsAvailable}, Should Spawn: ${shouldSpawnHarvesters}, Available Positions: ${availablePositionsCount}, Reserved Count: ${reservedWorkParts}, Required Count: ${requiredWorkParts}`)

            if (shouldSpawnHarvesters) {
                const sourceRoomPosition = new RoomPosition(harvestTask.sourcePosition.x, harvestTask.sourcePosition.y, roomName)
                if (sourceRoomPosition) {
                    const nearestSpawn = sourceRoomPosition.findClosestByRange(FIND_MY_SPAWNS, { filter: (spawn) => spawn.spawning === null && !spawnsReserved.includes(spawn.id) })

                    if (!nearestSpawn) {
                        console.log(`SpawnCreepsDebug: No available spawn found for harvest task '${harvestTask.sourceId}' in room ${roomName}`)
                        break
                    }
                    spawnsReserved.push(nearestSpawn.id)

                    const creepName = `Harvester-${harvestTask.sourceId}-${Game.time}`
                    nearestSpawn?.spawnCreep(
                        [WORK, CARRY, MOVE],
                        creepName,
                        {
                            memory: {
                                task: {
                                    type: "harvest",
                                    taskId: `${harvestTask.roomName}-${harvestTask.sourceId}`,
                                    sourceId: harvestTask.sourceId,
                                    sourcePosition: harvestTask.sourcePosition,
                                }
                            }
                        }
                    )
                    harvestTask.reservingCreeps[creepName] = {
                        workParts: 1
                    }
                }
            }
        }

        const upgradeTask = roomTasks.upgrade

        if (upgradeTask) {
            const controller = room.controller

            if(!controller) continue

            const nearestSpawn = controller.pos.findClosestByRange(FIND_MY_SPAWNS, { filter: (spawn) => spawn.spawning === null && !spawnsReserved.includes(spawn.id) })
            if (!nearestSpawn) {
                console.log(`SpawnCreepsDebug: No available spawn found for upgrade task in room ${roomName}`)
                continue
            }

            nearestSpawn.spawnCreep(
                [WORK, CARRY, MOVE],
                `Upgrader-${upgradeTask.controllerId}-${Game.time}`,
                {
                    memory: {
                        task: {
                            type: "upgrade",
                            taskId: `${upgradeTask.roomName}-${upgradeTask.controllerId}`,
                            controllerId: upgradeTask.controllerId,
                            controllerPosition: upgradeTask.controllerPosition,
                            workParts: 1
                        }
                    }
                }
            )
        }
    }
}


function getIntersection(array1: string[], array2: string[]): string[] {
  const set = new Set(array2);
  return array1.filter(item => set.has(item));
}