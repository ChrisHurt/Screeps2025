import { calculateRoomEnergyProduction } from "helpers/calculateRoomEnergyProduction"
import { calculateCreepUpkeep } from "helpers/calculateCreepUpkeep"
import { CreepHarvestTask, CreepRole, CreepUpgradeTask, EnergyImpactType, ReservingCreeps, SharedCreepState } from "types"
import { calculateHarvesterProduction } from "helpers/calculateHarvesterProduction"

export const spawnCreeps = () => {
    const rooms = Game.rooms

    for (const roomName in rooms) {
        const room = rooms[roomName]

        if(!room) {
            console.log(`SpawnCreepsError: Room ${roomName} not found in Game.rooms`)
            continue
        }

        const roomMemory = Memory.rooms[roomName]

        if (!roomMemory) {
            console.log(`SpawnCreepsError: No memory found for room ${roomName}`)
            continue
        }

        const roomTasks = roomMemory.tasks

        if (!roomTasks) {
            console.log(`SpawnCreepsDebug: No tasks found for room ${roomName}`)
            continue
        }

        const roomSpawns = room.find(FIND_MY_SPAWNS)
        let spawnsAvailable = roomSpawns.filter(spawn => spawn.spawning === null)

        if (spawnsAvailable.length === 0) {
            console.log(`SpawnCreepsDebug: No available spawns found in room ${roomName}`)
            continue
        }

        const harvestTasks = roomTasks.harvest

        if (!harvestTasks) {
            console.log(`SpawnCreepsDebug: No harvest tasks found for room ${roomName}`)
            continue
        }

        for (const harvestTask of harvestTasks) {
            // If energy is not available for spawning, skip
            if (room.energyAvailable < 200) {
                console.log(`SpawnCreepsDebug: Not enough energy to spawn in room ${roomName}`)
                continue
            }

            const {
                workParts: reservedWorkParts,
                creeps: reservedCreepsCount
            } = Object.values(Memory.reservations.tasks).reduce((totals, task) => {
                if (task.type === "harvest" && task.sourceId === harvestTask.sourceId) {
                    return {
                        workParts: totals.workParts + (task.workParts || 0),
                        creeps: totals.creeps + 1
                    }
                }
                return totals
            }, {
                workParts: 0,
                creeps: 0
            })

            const requiredWorkParts = harvestTask.requiredWorkParts
            const availablePositionsCount = harvestTask.availablePositions.length

            const workersAreNeeded = requiredWorkParts - reservedWorkParts > 0
            const roomIsAvailable = reservedCreepsCount < availablePositionsCount

            const shouldSpawnHarvesters = workersAreNeeded && roomIsAvailable

            console.log(`SpawnCreepsDebug: Room ${roomName} - Harvest Task ${harvestTask.sourceId}: Workers Needed: ${workersAreNeeded}, Room Available: ${roomIsAvailable}, Should Spawn: ${shouldSpawnHarvesters}, Available Positions: ${availablePositionsCount}, Reserved Count: ${reservedWorkParts}, Required Count: ${requiredWorkParts}`)

            if (shouldSpawnHarvesters) {
                const sourceRoomPosition = new RoomPosition(harvestTask.sourcePosition.x, harvestTask.sourcePosition.y, roomName)
                const nearestSpawn = sourceRoomPosition.findClosestByPath(spawnsAvailable)

                if (!nearestSpawn) {
                    console.log(`SpawnCreepsDebug: No available spawn found for harvest task '${harvestTask.sourceId}' in room ${roomName}`)
                    break
                }

                spawnsAvailable = spawnsAvailable.filter(spawn => spawn.id !== nearestSpawn.id)

                const creepName = `Harvester-${harvestTask.sourceId}-${Game.time}`
                const creepBody = [WORK, CARRY, MOVE]

                const {
                    productionPerTick,
                    returnPath,
                } = calculateHarvesterProduction({
                    carryParts: 1,
                    spawnPositions: room.find(FIND_MY_SPAWNS).map(spawn => spawn.pos),
                    sourcePosition: harvestTask.sourcePosition,
                    workParts: 1,
                })

                const creepHarvestTask: CreepHarvestTask = {
                    sourceId: harvestTask.sourceId,
                    sourcePosition: harvestTask.sourcePosition,
                    type: "harvest",
                    taskId: `${harvestTask.roomName}-${harvestTask.sourceId}`,
                    workParts: 1,
                    returnPath: returnPath
                }

                nearestSpawn.spawnCreep(
                    creepBody,
                    creepName,
                    { memory: { role: CreepRole.HARVESTER, state: SharedCreepState.idle, task: creepHarvestTask, idleStarted: Game.time } }
                )

                Memory.reservations.tasks[creepName] = creepHarvestTask

                const perTickUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: true })

                // NOTE: Update rooms energy production
                Memory.production.energy[creepName] = {
                    perTickAmount: productionPerTick - perTickUpkeep,
                    roomNames: [roomName],
                    type: EnergyImpactType.CREEP,
                }

                roomMemory.effectiveEnergyPerTick = calculateRoomEnergyProduction(roomName)
            }
        }

        const upgradeTask = roomTasks.upgrade

        if (room.energyAvailable < 200) {
            console.log(`SpawnCreepsDebug: Not enough energy to spawn in room ${roomName}`)
            continue
        }

        if (!upgradeTask || !upgradeTask.controllerId || !upgradeTask.controllerPosition) {
            console.log(`SpawnCreepsDebug: No upgrade task found for room ${roomName}`)
            continue
        }

        const controller = room.controller
        if(!controller) continue

        const nearestSpawn = controller.pos.findClosestByPath(spawnsAvailable)
        if (!nearestSpawn) {
            console.log(`SpawnCreepsDebug: No available spawn found for upgrade task in room ${roomName}`)
            continue
        }

        const effectiveEnergyPerTick = roomMemory.effectiveEnergyPerTick || 0

        const reservedUpgraderWorkParts = Object.values(Memory.reservations.tasks).reduce((total, task) => {
            if (task.type === "upgrade" && task.controllerId === upgradeTask.controllerId) {
                return total + (task.workParts || 0)
            }
            return total
        }, 0)

        const shouldSpawnUpgrader = reservedUpgraderWorkParts === 0 ? true : Math.floor(reservedUpgraderWorkParts / effectiveEnergyPerTick) < 4

        if (!shouldSpawnUpgrader) continue

        spawnsAvailable = spawnsAvailable.filter(spawn => spawn.id !== nearestSpawn.id)

        const creepName = `Upgrader-${upgradeTask.controllerId}-${Game.time}`
        const creepBody = [WORK, CARRY, MOVE]
        const creepUpgradeTask: CreepUpgradeTask = {
            controllerId: upgradeTask.controllerId,
            controllerPosition: upgradeTask.controllerPosition,
            taskId: `${upgradeTask.roomName}-${upgradeTask.controllerId}`,
            type: "upgrade",
            workParts: 1
        }
        nearestSpawn.spawnCreep(
            creepBody,
            creepName,
            { memory: { role: CreepRole.UPGRADER, state: SharedCreepState.idle, task: creepUpgradeTask, idleStarted: Game.time } }
        )

        Memory.reservations.tasks[creepName] = creepUpgradeTask

        const perTickUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: false })

        // NOTE: Update rooms energy production
        Memory.production.energy[creepName] = {
            perTickAmount: -perTickUpkeep,
            roomNames: [roomName],
            type: EnergyImpactType.CREEP,
        }

        roomMemory.effectiveEnergyPerTick = calculateRoomEnergyProduction(roomName)
    }
}
