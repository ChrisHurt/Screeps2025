import { calculateCreepUpkeep } from "helpers/calculateCreepUpkeep"
import { calculateHarvesterProduction } from "helpers/calculateHarvesterProduction"
import { calculateRoomEnergyProduction } from "helpers/calculateRoomEnergyProduction"
import { addProducerCreepToEnergyLogistics } from "helpers/logistics/addProducerCreepToEnergyLogistics"
import { CreepHarvestTask, CreepRole, CustomRoomMemory, EnergyImpactType, RoomHarvestTask, RoomName, SharedCreepState } from "types"

interface SpawnHarvestersInput {
    harvestTasks: RoomHarvestTask[]
    room: Room
    roomMemory: CustomRoomMemory
    roomName: RoomName
    spawnsAvailable: StructureSpawn[]
}

export const spawnHarvesters = (options: SpawnHarvestersInput): { harvestTasksNeedCreeps: boolean; spawnsAvailable: StructureSpawn[] } => {
    let {
        harvestTasks,
        room,
        roomMemory,
        roomName,
        spawnsAvailable,
    } = options

    let harvestTasksNeedCreeps = false
    for (const harvestTask of harvestTasks) {
        if (room.energyAvailable < 300) {
            console.log(`SpawnCreepsDebug: Not enough energy to spawn in room ${roomName}`)
            harvestTasksNeedCreeps = true
            break
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

            const spawnResult = nearestSpawn.spawnCreep(
                creepBody,
                creepName,
                { memory: { role: CreepRole.HARVESTER, state: SharedCreepState.idle, task: creepHarvestTask, idleStarted: Game.time } }
            )

            if (spawnResult !== OK) {
                console.log(`SpawnCreepsDebug: Failed to spawn harvester in room ${roomName} for source ${harvestTask.sourceId}. Spawn result: ${spawnResult}`)
                harvestTasksNeedCreeps = true
                continue
            }

            Memory.reservations.tasks[creepName] = creepHarvestTask

            const perTickUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: true })

            // NOTE: Update rooms energy production
            Memory.production.energy[creepName] = {
                perTickAmount: productionPerTick - perTickUpkeep,
                roomNames: [roomName],
                type: EnergyImpactType.CREEP,
            }

            roomMemory.effectiveEnergyPerTick = calculateRoomEnergyProduction(roomName)

            addProducerCreepToEnergyLogistics({
                energy: {
                    current: 0,
                    capacity: creepBody.filter(part => part === CARRY).length * 50
                },
                pos: nearestSpawn.pos,
                productionPerTick,
                name: creepName,
                role: CreepRole.HARVESTER,
                roomName
            })
        }
    }
    return { harvestTasksNeedCreeps, spawnsAvailable }
}