import {CreepRole} from "types"
import { spawnGuards } from "./spawnGuards"
import { spawnHarvesters } from "./spawnHarvesters"
import { spawnHaulers } from "./spawnHaulers"
import { spawnBuilders } from "./spawnBuilders"
import { spawnUpgraders } from "./spawnUpgraders"

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
        const { guardCount, upgraderCount, builderCount, haulerCount } = myCreeps.reduce((counts, creep) => {
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
            case CreepRole.HAULER:
                counts.haulerCount++
                break
            }
            return counts
        }, { guardCount: 0, upgraderCount: 0, builderCount: 0, haulerCount: 0 })

        spawnsAvailable = spawnGuards({
            guardCount,
            room,
            roomMemory,
            roomName,
            spawnsAvailable
        })

        const { harvestTasksNeedCreeps, spawnsAvailable: spawnsAfterHarvesting } = spawnHarvesters({
            harvestTasks: roomTasks.harvest,
            room,
            roomMemory,
            roomName,
            spawnsAvailable
        })
        spawnsAvailable = spawnsAfterHarvesting

        if (harvestTasksNeedCreeps && room.energyAvailable < 300) continue

        spawnsAvailable = spawnHaulers({
            haulerCount,
            room,
            roomMemory,
            roomName,
            spawnsAvailable
        })

        spawnsAvailable = spawnBuilders({
            builderCount,
            buildTasks: roomTasks.build,
            room,
            roomMemory,
            roomName,
            spawnsAvailable
        })


        if (room.energyAvailable < 200) {
            console.log(`SpawnCreepsDebug: Not enough energy to spawn in room ${roomName}`)
            continue
        }

        const upgradeTask = roomTasks.upgrade

        upgradeTask && (spawnsAvailable = spawnUpgraders({
            effectiveEnergyPerTick: roomMemory.effectiveEnergyPerTick || 0,
            upgraderCount,
            upgradeTask,
            room,
            roomMemory,
            roomName,
            spawnsAvailable
        }))
    }
}
