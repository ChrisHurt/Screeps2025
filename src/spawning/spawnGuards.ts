import { calculateCreepUpkeep } from "helpers/calculateCreepUpkeep"
import { CreepRole, CustomRoomMemory, EnergyImpactType, RoomName, SharedCreepState, CreepEnergyImpact } from "types"

interface SpawnGuardsInput {
    guardCount: number
    room: Room
    roomMemory: CustomRoomMemory
    roomName: RoomName
    spawnsAvailable: StructureSpawn[]
}

export const spawnGuards = ({
    guardCount,
    room,
    roomMemory,
    roomName,
    spawnsAvailable,
}: SpawnGuardsInput): StructureSpawn[] => {
    if (roomMemory.threats && roomMemory.threats.enemyCreepCount > guardCount) {
        if (room.energyAvailable < 140) {
            console.log(`SpawnCreepsDebug: Not enough energy to spawn in room ${roomName}`)
            return spawnsAvailable
        }

        // Calculate cost -> Add to production.energy
        const creepBody = [TOUGH, ATTACK, MOVE]
        const guardSpawn = spawnsAvailable[0]

        if(!guardSpawn) {
            console.log(`SpawnCreepsDebug: No available spawns to spawn guard in room ${roomName}`)
            return spawnsAvailable
        }

        spawnsAvailable = spawnsAvailable.filter(spawn => spawn.id !== guardSpawn.id)

        const perTickUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: false })

        const energyImpact: CreepEnergyImpact = {
            perTickAmount: - perTickUpkeep,
            roomNames: [roomName],
            role: CreepRole.GUARD,
            type: EnergyImpactType.CREEP,
        }

        const creepName = `Guard-${guardSpawn.id}-${Game.time}`
        const spawnResult = guardSpawn.spawnCreep(creepBody, creepName, {
            memory: {
                idleStarted: Game.time + creepBody.length * 3,
                role: CreepRole.GUARD,
                state: SharedCreepState.idle,
                energyImpact: energyImpact
            }
        })

        if (spawnResult !== OK) {
            console.log(`SpawnCreepsDebug: Failed to spawn guard in room ${roomName} with error ${spawnResult}`)
            return spawnsAvailable
        }
    }
    return spawnsAvailable
}