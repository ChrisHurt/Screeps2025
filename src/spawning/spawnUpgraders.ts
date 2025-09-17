import { calculateUpgraderProduction } from "calculateUpgraderProduction"
import { calculateCreepUpkeep } from "helpers/calculateCreepUpkeep"
import { addConsumerCreepToEnergyLogistics } from "logistics/addConsumerCreepToEnergyLogistics"
import { getAllCreepTasks } from "../memory/deleteCreepFromMemory"
import { CreepRole, CreepUpgradeTask, CustomRoomMemory, EnergyImpactType, RoomName, RoomUpgradeTask, SharedCreepState, CreepEnergyImpact } from "types"

interface SpawnUpgradersInput {
    effectiveEnergyPerTick: number
    upgradeTask: RoomUpgradeTask
    upgraderCount: number
    room: Room
    roomMemory: CustomRoomMemory
    roomName: RoomName
    spawnsAvailable: StructureSpawn[]
}

export const spawnUpgraders = ({
    effectiveEnergyPerTick,
    upgraderCount,
    upgradeTask,
    room,
    roomMemory,
    roomName,
    spawnsAvailable,
}: SpawnUpgradersInput): StructureSpawn[] => {
    if (!upgradeTask || !upgradeTask.controllerId || !upgradeTask.controllerPosition) {
        console.log(`SpawnCreepsDebug: No upgrade task found for room ${roomName}`)
        return spawnsAvailable
    }

    const controller = room.controller
    if(!controller) return spawnsAvailable

    const nearestSpawn = controller.pos.findClosestByPath(spawnsAvailable)
    if (!nearestSpawn) {
        console.log(`SpawnCreepsDebug: No available spawn found for upgrade task in room ${roomName}`)
        return spawnsAvailable
    }
    const reservedUpgraderWorkParts = Object.values(getAllCreepTasks()).reduce((total, task) => {
        if (task.type === "upgrade" && task.controllerId === upgradeTask.controllerId) {
            return total + task.workParts
        }
        return total
    }, 0)

    const shouldSpawnUpgrader = reservedUpgraderWorkParts === 0 || (upgraderCount < 5 && effectiveEnergyPerTick > 3 && reservedUpgraderWorkParts < 15)

    if (!shouldSpawnUpgrader) return spawnsAvailable

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

    const perTickBodyUpkeep = calculateCreepUpkeep({ body: creepBody, isRenewed: true })

    const energyImpact: CreepEnergyImpact = {
        perTickAmount: - perTickBodyUpkeep - productionPerTick,
        roomNames: [roomName],
        role: CreepRole.UPGRADER,
        type: EnergyImpactType.CREEP,
    }

    const spawnResult = nearestSpawn.spawnCreep(
        creepBody,
        creepName,
        { memory: { role: CreepRole.UPGRADER, state: SharedCreepState.idle, task: creepUpgradeTask, idleStarted: Game.time, energyImpact: energyImpact } }
    )

    if (spawnResult !== OK) {
        console.log(`SpawnCreepsDebug: Failed to spawn upgrader in room ${roomName} with error ${spawnResult}`)
        return spawnsAvailable
    }

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
        role: CreepRole.UPGRADER,
        roomName
    })
    return spawnsAvailable
}