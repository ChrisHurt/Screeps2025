
import { moveInRangeOfPos } from "behaviours/sharedCreepBehaviours/moveInRangeOfPos"
import { Service } from "robot3"
import { UpgraderContext, UpgraderMachine, UpgraderMachineStateTypes } from "stateMachines/upgrader-machine"
import { SharedCreepEventType, SharedCreepState } from "types"

interface UpgradeInput {
    creep: Creep
    context: UpgraderContext
    service: Service<UpgraderMachine>
}

interface UpgradeOutput {
    continue: boolean
    state: UpgraderMachineStateTypes
}

export const upgrade = ({
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

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        upgraderService.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.collectingEnergy }
    }

    return { continue: false, state: SharedCreepState.upgrading }
}