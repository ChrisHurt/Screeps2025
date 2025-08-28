import { calculateRoomEnergyProduction } from "helpers/calculateRoomEnergyProduction"
import { calculateCreepUpkeep } from "helpers/calculateCreepUpkeep"
import { CreepBuildTask, CreepHarvestTask, CreepRole, CreepUpgradeTask, EnergyImpactType, ReservingCreeps, SharedCreepState } from "types"
import { calculateHarvesterProduction } from "helpers/calculateHarvesterProduction"
import { calculateUpgraderProduction } from "calculateUpgraderProduction"
import { calculateBuilderProduction } from "calculateBuilderProduction"

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

        const myCreeps = room.find(FIND_MY_CREEPS)
        const { guardCount, upgraderCount, builderCount } = myCreeps.reduce((counts, creep) => {
            switch (creep.memory?.role) {
            case CreepRole.GUARD:
                counts.guardCount++
                break
            case CreepRole.UPGRADER:
                counts.upgraderCount++
                break
            case CreepRole.BUILDER:
                counts.builderCount++
                break
            }
            return counts
        }, { guardCount: 0, upgraderCount: 0, builderCount: 0 })

        if (roomMemory.threats && roomMemory.threats.enemyCreepCount > guardCount) {
            if (room.energyAvailable < 140) {
                console.log(`SpawnCreepsDebug: Not enough energy to spawn in room ${roomName}`)
                continue
            }

            // Calculate cost -> Add to production.energy
            const creepBody = [TOUGH, ATTACK, MOVE]
            const spawn = roomSpawns[0]
            const creepName = `Guard-${spawn.id}-${Game.time}`
            const perTickUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: false })

            // NOTE: Update rooms energy production
            Memory.production.energy[creepName] = {
                perTickAmount: - perTickUpkeep,
                roomNames: [roomName],
                type: EnergyImpactType.CREEP,
            }

            spawn.spawnCreep(creepBody, creepName, {
                memory: {
                    idleStarted: Game.time + creepBody.length * 3,
                    role: CreepRole.GUARD,
                    state: SharedCreepState.idle
                }
            })
        }

        const harvestTasks = roomTasks.harvest

        if (!harvestTasks) {
            console.log(`SpawnCreepsDebug: No harvest tasks found for room ${roomName}`)
            continue
        }

        for (const harvestTask of harvestTasks) {
            if (room.energyAvailable < 300) {
                console.log(`SpawnCreepsDebug: Not enough energy to spawn in room ${roomName}`)
                continue
            }

            const {
                workParts: reservedWorkParts,
                creeps: reservedCreepsCount
            } = Object.values(Memory.reservations.tasks).reduce((totals, task) => {
                if (task.type === "harvest" && task.sourceId === harvestTask.sourceId) {
                    return {
                        workParts: totals.workParts + task.workParts,
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
                const creepBody = [WORK,WORK,CARRY,MOVE]

                const {
                    productionPerTick,
                    returnPath,
                } = calculateHarvesterProduction({
                    carryParts: 1,
                    spawnPositions: room.find(FIND_MY_SPAWNS).map(spawn => spawn.pos),
                    sourcePosition: harvestTask.sourcePosition,
                    workParts: 2,
                })

                const creepHarvestTask: CreepHarvestTask = {
                    sourceId: harvestTask.sourceId,
                    sourcePosition: harvestTask.sourcePosition,
                    type: "harvest",
                    taskId: `${harvestTask.roomName}-${harvestTask.sourceId}`,
                    workParts: 2,
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

        const buildTasks = roomTasks.build

        const effectiveEnergyPerTick = roomMemory.effectiveEnergyPerTick || 0

        const shouldSpawnBuilders = buildTasks.length > 0 && (builderCount === 0 || (builderCount < 2 && effectiveEnergyPerTick > 2))

        console.log(`SpawnCreepsDebug: Room ${roomName} - Build Tasks: ${buildTasks.length}, Effective Energy Per Tick: ${effectiveEnergyPerTick}, Should Spawn Builders: ${shouldSpawnBuilders}`)

        if (shouldSpawnBuilders) {
            for (const buildTask of buildTasks) {
                if (room.energyAvailable < 300) {
                    console.log(`SpawnCreepsDebug: Not enough energy to spawn in room ${roomName}`)
                    continue
                }

                const buildPosition = new RoomPosition(buildTask.buildParams.position.x, buildTask.buildParams.position.y, buildTask.buildParams.position.roomName)
                const nearestSpawn = buildPosition.findClosestByPath(spawnsAvailable)
                if (!nearestSpawn) {
                    console.log(`SpawnCreepsDebug: No available spawn found for build task in room ${roomName}`)
                    continue
                }
                const creepName = `Builder-${buildTask.roomName}-${Game.time}`
                const creepBody = [WORK,CARRY,CARRY,MOVE,MOVE]

                const productionPerTick = calculateBuilderProduction({
                    creepBody,
                    path: buildTask.buildParams.path
                })
                const creepBuildTask: CreepBuildTask = {
                    position: buildTask.buildParams.position,
                    repairDuringSiege: buildTask.buildParams.repairDuringSiege,
                    path: buildTask.buildParams.path,
                    taskId: `${buildTask.roomName}`,
                    type: "build",
                }

                nearestSpawn.spawnCreep(
                    creepBody,
                    creepName,
                    { memory: { role: CreepRole.BUILDER, state: SharedCreepState.idle, task: creepBuildTask, idleStarted: Game.time } }
                )

                spawnsAvailable = spawnsAvailable.filter(spawn => spawn.id !== nearestSpawn.id)

                Memory.reservations.tasks[creepName] = creepBuildTask

                const perTickBodyUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: true })

                // NOTE: Update rooms energy production
                Memory.production.energy[creepName] = {
                    perTickAmount: - perTickBodyUpkeep - productionPerTick,
                    roomNames: [roomName],
                    type: EnergyImpactType.CREEP,
                }

                roomMemory.effectiveEnergyPerTick = calculateRoomEnergyProduction(roomName)
                console.log(`SpawnCreepsDebug: Builder spawned in room ${roomName} with name ${creepName}`)
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
        const reservedUpgraderWorkParts = Object.values(Memory.reservations.tasks).reduce((total, task) => {
            if (task.type === "upgrade" && task.controllerId === upgradeTask.controllerId) {
                return total + task.workParts
            }
            return total
        }, 0)

        const shouldSpawnUpgrader = reservedUpgraderWorkParts === 0 || (upgraderCount < 5 && effectiveEnergyPerTick > 3 && reservedUpgraderWorkParts < 15)

        if (!shouldSpawnUpgrader) continue

        spawnsAvailable = spawnsAvailable.filter(spawn => spawn.id !== nearestSpawn.id)

        const creepName = `Upgrader-${upgradeTask.controllerId}-${Game.time}`
        const creepBody = [WORK, CARRY, MOVE]

        const {
            productionPerTick,
            returnPath
        } = calculateUpgraderProduction({
            carryParts: 1,
            controllerPosition: upgradeTask.controllerPosition,
            spawnPositions: [nearestSpawn.pos],
            workParts: 1
        })
        const creepUpgradeTask: CreepUpgradeTask = {
            controllerId: upgradeTask.controllerId,
            controllerPosition: upgradeTask.controllerPosition,
            returnPath,
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

        const perTickBodyUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: true })

        // NOTE: Update rooms energy production
        Memory.production.energy[creepName] = {
            perTickAmount: - perTickBodyUpkeep - productionPerTick,
            roomNames: [roomName],
            type: EnergyImpactType.CREEP,
        }

        roomMemory.effectiveEnergyPerTick = calculateRoomEnergyProduction(roomName)
    }
}
