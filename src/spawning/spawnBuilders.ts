import { calculateBuilderProduction } from "calculateBuilderProduction"
import { calculateCreepUpkeep } from "helpers/calculateCreepUpkeep"
import { calculateRoomEnergyProduction } from "helpers/calculateRoomEnergyProduction"
import { addConsumerCreepToEnergyLogistics } from "helpers/logistics/addConsumerCreepToEnergyLogistics"
import { CreepBuildTask, CreepRole, CustomRoomMemory, EnergyImpactType, RoomBuildTask, RoomName, SharedCreepState } from "types"

interface SpawnBuildersInput {
    buildTasks: RoomBuildTask[]
    builderCount: number
    room: Room
    roomMemory: CustomRoomMemory
    roomName: RoomName
    spawnsAvailable: StructureSpawn[]
}

export const spawnBuilders = ({
    builderCount,
    buildTasks,
    room,
    roomMemory,
    roomName,
    spawnsAvailable,
}: SpawnBuildersInput): StructureSpawn[] => {
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

            const spawnResult = nearestSpawn.spawnCreep(
                creepBody,
                creepName,
                { memory: { role: CreepRole.BUILDER, state: SharedCreepState.idle, task: creepBuildTask, idleStarted: Game.time } }
            )

            if (spawnResult !== OK) {
                console.log(`SpawnCreepsDebug: Failed to spawn builder in room ${roomName} with error ${spawnResult}`)
                if (spawnResult === ERR_NOT_ENOUGH_ENERGY) {
                    spawnsAvailable = spawnsAvailable.filter(spawn => spawn.id !== nearestSpawn.id)
                }

                return spawnsAvailable
            }

            // Remove the spawn from available list since it was successfully used
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

            addConsumerCreepToEnergyLogistics({
                depositTiming: {
                    earliestTick: Game.time,
                    latestTick: Game.time
                },
                energy: {
                    current: 0,
                    capacity: creepBody.filter(part => part === CARRY).length * 50
                },
                pos: nearestSpawn.pos,
                productionPerTick,
                name: creepName,
                role: CreepRole.BUILDER,
                roomName
            })

            console.log(`SpawnCreepsDebug: Builder spawned in room ${roomName} with name ${creepName}`)
        }
    }
    return spawnsAvailable
}