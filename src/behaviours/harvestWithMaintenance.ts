import { Service } from "robot3"
import { HarvesterContext, HarvesterMachine, } from "stateMachines/harvester-machine"
import { CreepHarvestTask, SharedCreepEventType, SharedCreepState } from "types"
import { incidentalMaintenance } from "./incidentalMaintenance"
import { incidentalDeposit } from "./incidentalDeposit"

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

const BUILD_OR_REPAIR_ENERGY_THRESHOLD = 10

// NOTE: Returns true if should continue
export const harvestWithMaintenance = ({ creep, creepTask, context, service}: HarvestParams): HarvestOutput => {
    const isFull = context.energy >= context.capacity

    if (isFull) {
        service.send({ type: SharedCreepEventType.full })
        return { continue: true, state: SharedCreepState.depositingEnergy }
    }

    const {
        sourceId,
        sourcePosition,
    } = creepTask

    const creepRoom = creep.room
    const source = creepRoom.find(FIND_SOURCES).find(s => s.id === sourceId)

    if (!source) {
        console.log(`Source with ID ${sourceId} not found for creep ${creep.name}`)

        service.send({ type: SharedCreepEventType.idle })

        return { continue: true, state: SharedCreepState.idle }
    }

    const creepPosition = creep.pos
    if (!creepPosition.isNearTo(sourcePosition)) {
        creep.moveTo(sourcePosition.x, sourcePosition.y, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } })
    }

    if (creepPosition.inRangeTo(sourcePosition, 1)) {
        creep.harvest(source)
    }

    const creepIsApproachingFullEnergy = context.capacity - context.energy <= BUILD_OR_REPAIR_ENERGY_THRESHOLD
    const creepRepairAmountPerTick = creep.getActiveBodyparts(WORK) * REPAIR_POWER

    incidentalMaintenance({
        creep,
        creepPosition,
        creepIsApproachingFullEnergy,
        creepRepairAmountPerTick
    })

    incidentalDeposit({
        creep,
        creepPosition
    })

    return { continue: false, state: SharedCreepState.harvesting }
}