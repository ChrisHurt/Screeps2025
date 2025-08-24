import { Service } from "robot3"
import { BuilderEventType, BuilderMachine } from "stateMachines/builder-machine"
import { CreepBuildTask, SharedCreepEventType, SharedCreepState } from "types"
import { assignNextBuildTask } from "../helpers/assignNextBuildTask"

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

    if (!site) {
        // Construction site is complete, remove the task from room memory
        const roomName = buildTask.position.roomName
        const roomMemory = Memory.rooms[roomName]
        if (roomMemory?.tasks?.build) {
            roomMemory.tasks.build = roomMemory.tasks.build.filter(
                task => !(task.buildParams.position.x === buildTask.position.x &&
                         task.buildParams.position.y === buildTask.position.y &&
                         task.buildParams.position.roomName === buildTask.position.roomName)
            )
        }

        // Try to assign the next available task (index 0 is top priority)
        if (assignNextBuildTask(creep)) {
            // Successfully assigned a new task, continue building
            return { continue: true, state: SharedCreepState.building }
        }

        // No more build tasks available, go idle
        return { continue: false, state: SharedCreepState.idle }
    }

    if (creep.pos.inRangeTo(site, 3)) {
        creep.build(site)
    }

    if (!creep.pos.inRangeTo(site, 2)) {
        creep.moveTo(targetPos)
    }
    return { continue: true, state: SharedCreepState.building }
}
