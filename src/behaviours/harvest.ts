import { Service } from "robot3"
import { HarvesterContext, HarvesterMachine, } from "stateMachines/harvester-machine"
import { CreepHarvestTask, SharedCreepEventType, SharedCreepState } from "types"

interface HarvestParams {
    creep: Creep
    creepTask: CreepHarvestTask
    context: HarvesterContext
    service: Service<HarvesterMachine>
}

interface HarvestOutput {
    continue: boolean
    state: SharedCreepState.harvesting | SharedCreepState.depositingEnergy | SharedCreepState.idle
}

// NOTE: Returns true if should continue
export const harvest = ({ creep, creepTask, context, service}: HarvestParams): HarvestOutput => {
    const isFull = context.energy >= context.capacity

    if (isFull) {
        service.send({ type: SharedCreepEventType.full })
        return { continue: true, state: SharedCreepState.depositingEnergy }
    }

    const {
        sourceId,
        sourcePosition,
    } = creepTask

    const source = creep.room.find(FIND_SOURCES).find(s => s.id === sourceId)

    if (!source) {
        console.log(`Source with ID ${sourceId} not found for creep ${creep.name}`)

        service.send({ type: SharedCreepEventType.idle })

        return { continue: true, state: SharedCreepState.idle }
    }

    if (!creep.pos.isNearTo(sourcePosition)) {
        creep.moveTo(sourcePosition.x, sourcePosition.y, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } })
    }

    if (creep.pos.inRangeTo(sourcePosition, 1)) {
        creep.harvest(source)
    }

    return { continue: false, state: SharedCreepState.harvesting }
}