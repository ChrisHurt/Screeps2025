
import { moveInRangeOfPos } from "behaviours/moveInRangeOfPos"
import { Service } from "robot3"
import { UpgraderContext, UpgraderMachine, UpgraderMachineStateTypes } from "stateMachines/upgrader-machine"
import { SharedCreepEventType, SharedCreepState } from "types"
import { incidentalMaintenance } from "./incidentalMaintenance"

interface UpgradeInput {
    creep: Creep
    context: UpgraderContext
    service: Service<UpgraderMachine>
}

interface UpgradeOutput {
    continue: boolean
    state: UpgraderMachineStateTypes
}

const BUILD_OR_REPAIR_ENERGY_THRESHOLD = 10

export const upgradeWithMaintenance = ({
    creep,
    context,
    service: upgraderService
}: UpgradeInput): UpgradeOutput => {
    const isEmpty = context.energy === 0
    if (isEmpty) {
        upgraderService.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.collectingEnergy }
    }

    const controller = creep.room.controller

    if (!controller) {
        upgraderService.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    moveInRangeOfPos({
        creep,
        offset: 2,
        target: controller.pos
    })

    if (controller.pos.inRangeTo(creep, 3)) {
        creep.upgradeController(controller)
    }

    const creepIsApproachingFullEnergy = context.capacity - context.energy <= BUILD_OR_REPAIR_ENERGY_THRESHOLD
    const creepRepairAmountPerTick = creep.getActiveBodyparts(WORK) * REPAIR_POWER

    incidentalMaintenance({
        creep,
        creepPosition: creep.pos,
        creepIsApproachingFullEnergy,
        creepRepairAmountPerTick
    })

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        upgraderService.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.collectingEnergy }
    }

    return { continue: false, state: SharedCreepState.upgrading }
}