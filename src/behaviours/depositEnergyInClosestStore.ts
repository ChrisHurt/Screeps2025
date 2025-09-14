import { Service } from "robot3"
import { HarvesterContext, HarvesterMachine } from "stateMachines/harvester-machine"
import { SharedCreepEventType, SharedCreepState } from "types"

interface DepositEnergyParams {
    creep: Creep
    context: HarvesterContext
    service: Service<HarvesterMachine>
}

interface DepositEnergyOutput {
    continue: boolean
    state: SharedCreepState.idle | SharedCreepState.depositingEnergy | SharedCreepState.error | SharedCreepState.recycling
}

// NOTE: Returns true if should continue
export const depositEnergyInClosestStore = ({ creep, context, service}: DepositEnergyParams): DepositEnergyOutput => {
    const isEmpty = context.energy === 0
    if (isEmpty) {
        service.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.idle }
    }

    const closestStore = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => "store" in structure && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    })

    if (!closestStore) {
        console.log(`Storage not found for creep ${creep.name}`)

        service.send({ type: SharedCreepEventType.idle })

        return  { continue: true, state: SharedCreepState.idle }
    }

    if (!creep.pos.isNearTo(closestStore)) {
        creep.moveTo(closestStore.pos.x, closestStore.pos.y, { reusePath: 5, visualizePathStyle: { stroke: '#fff' } })
    }

    if (creep.pos.inRangeTo(closestStore, 1)) {
        creep.transfer(closestStore, RESOURCE_ENERGY)
        if("renewCreep" in closestStore && creep.ticksToLive && creep.ticksToLive < CREEP_LIFE_TIME - 200) {
            closestStore.renewCreep(creep)
        }
        return  { continue: true, state: SharedCreepState.idle }
    }
    return  { continue: false, state: SharedCreepState.depositingEnergy }
}