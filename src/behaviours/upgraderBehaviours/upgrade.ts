
import { moveInRangeOfPos } from "behaviours/sharedCreepBehaviours/moveInRangeOfPos"
import { Service } from "robot3"
import { UpgraderContext, UpgraderEventType, UpgraderMachine, UpgraderState } from "stateMachines/upgrader-machine"
import { SharedCreepEventType, SharedCreepState } from "types"

interface UpgradeInput {
    creep: Creep
    context: UpgraderContext
    upgraderService: Service<UpgraderMachine>
}

interface UpgradeOutput {
    continue: boolean
    state: SharedCreepState | UpgraderState
}

export const upgrade = ({
    creep,
    context,
    upgraderService
}: UpgradeInput): UpgradeOutput => {
    const isEmpty = context.energy === 0
    if (isEmpty) {
        upgraderService.send({ type: UpgraderEventType.empty })
        return { continue: true, state: UpgraderState.collecting }
    }

    const controller = creep.room.controller

    if (!controller) {
        upgraderService.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    moveInRangeOfPos({
        creep,
        offset: 1,
        target: controller.pos
    })

    if (controller.pos.inRangeTo(creep, 3)) {
        creep.upgradeController(controller)
    }

    return { continue: false, state: UpgraderState.upgrading }
}