import { Service } from "robot3"
import { BuilderEventType, BuilderMachine } from "stateMachines/builder-machine"
import { CreepBuildTask, SharedCreepEventType, SharedCreepState } from "types"

interface BuildInput {
    creep: Creep
    service: Service<BuilderMachine>
}

interface BuildOutput {
    continue: boolean
    state: SharedCreepState.idle | SharedCreepState.building | SharedCreepState.collectingEnergy
}

export const build = ({ creep, service }: BuildInput): BuildOutput => {
    if (creep.store[RESOURCE_ENERGY] === 0) {
        service.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.collectingEnergy }
    }
    const buildTask = creep.memory.task as CreepBuildTask
    // Prioritise by progress
    const targetPos = new RoomPosition(buildTask.position.x, buildTask.position.y, buildTask.position.roomName)
    const site = targetPos.findInRange(FIND_CONSTRUCTION_SITES,0)[0]
    if (creep.pos.inRangeTo(site, 3)) {
        creep.build(site)
    }

    if (!creep.pos.inRangeTo(site, 2)) {
        creep.moveTo(targetPos)
    }
    return { continue: true, state: SharedCreepState.building }
}
