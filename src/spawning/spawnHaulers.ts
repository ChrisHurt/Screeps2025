import { calculateCreepUpkeep } from "helpers/calculateCreepUpkeep"
import { addCarrierCreepToEnergyLogistics } from "logistics/addCarrierToEnergyLogistics"
import { CreepRole, CustomRoomMemory, EnergyImpactType, RoomHarvestTask, RoomName, SharedCreepState, CreepEnergyImpact } from "types"

interface SpawnHaulersInput {
    haulerCount: number
    room: Room
    roomMemory: CustomRoomMemory
    roomName: RoomName
    spawnsAvailable: StructureSpawn[]
}

export const spawnHaulers = ({
    haulerCount,
    room,
    roomMemory,
    roomName,
    spawnsAvailable,
}: SpawnHaulersInput): StructureSpawn[] => {
    const haulingData = Memory.energyLogistics.hauling[roomName]
    const shouldSpawnHauler = haulerCount === 0 || haulingData?.net > 50

    if (shouldSpawnHauler && spawnsAvailable.length > 0) {
        let creepBody: BodyPartConstant[]
        let energyCost: number

        if (haulingData && haulingData.net > 100) {
            creepBody = [MOVE, CARRY, MOVE, CARRY]
            energyCost = 300
        } else {
            creepBody = [MOVE, CARRY]
            energyCost = 100
        }

        if (room.energyAvailable >= energyCost) {
            const nearestSpawn = spawnsAvailable[0]
            const creepName = `Hauler-${roomName}-${Game.time}`
            spawnsAvailable = spawnsAvailable.filter(spawn => spawn.id !== nearestSpawn.id)

            const perTickUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: true })

            const energyImpact: CreepEnergyImpact = {
                perTickAmount: -perTickUpkeep,
                roomNames: [roomName],
                role: CreepRole.HAULER,
                type: EnergyImpactType.CREEP,
            }

            const spawnResult = nearestSpawn.spawnCreep(
                creepBody,
                creepName,
                { memory: { role: CreepRole.HAULER, state: SharedCreepState.idle, idleStarted: Game.time, energyImpact: energyImpact } }
            )

            if (spawnResult !== OK) {
                console.log(`SpawnCreepsDebug: Failed to spawn hauler in room ${roomName} with error ${spawnResult}`)
                return spawnsAvailable
            }

            addCarrierCreepToEnergyLogistics({
                energy: {
                    current: 0,
                    capacity: creepBody.filter(part => part === CARRY).length * 50
                },
                pos: nearestSpawn.pos,
                name: creepName,
                role: CreepRole.HAULER,
                roomName
            })

            console.log(`SpawnCreepsDebug: Hauler spawned in room ${roomName} with name ${creepName}, body: ${creepBody}, energy cost: ${energyCost}`)
        }
    }
    return spawnsAvailable
}