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
export const depositEnergy = ({ creep, context, service}: DepositEnergyParams): DepositEnergyOutput => {
    const isEmpty = context.energy === 0
    if (isEmpty) {
        service.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.idle }
    }

    const spawnStorage = creep.room.find(FIND_MY_SPAWNS)[0]

    if (!spawnStorage) {
        console.log(`Spawn not found for creep ${creep.name}`)

        service.send({ type: SharedCreepEventType.idle })

        return  { continue: true, state: SharedCreepState.idle }
    }

    if (!creep.pos.isNearTo(spawnStorage)) {
        creep.moveTo(spawnStorage.pos.x, spawnStorage.pos.y, { reusePath: 5, visualizePathStyle: { stroke: '#fff' } })
    }

    if (creep.pos.inRangeTo(spawnStorage, 1)) {
        creep.transfer(spawnStorage, RESOURCE_ENERGY)
        if(!spawnStorage.spawning && creep.ticksToLive && creep.ticksToLive < CREEP_LIFE_TIME - 200) {
            spawnStorage.renewCreep(creep)
        }
        return  { continue: true, state: SharedCreepState.idle }
    }
    return  { continue: false, state: SharedCreepState.depositingEnergy }
}