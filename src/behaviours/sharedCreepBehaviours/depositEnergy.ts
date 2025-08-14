import { Service } from "robot3"
import { HarvesterContext, HarvesterEventType, HarvesterMachine, HarvesterState } from "stateMachines/harvester-machine"
import { SharedCreepState } from "types"

interface DepositEnergyParams {
    creep: Creep
    context: HarvesterContext
    service: Service<HarvesterMachine>
}

interface DepositEnergyOutput {
    continue: boolean
    state: HarvesterState.depositing | SharedCreepState.idle
}

// NOTE: Returns true if should continue
export const depositEnergy = ({ creep, context, service}: DepositEnergyParams): DepositEnergyOutput => {
    const isEmpty = context.energy === 0
    if (isEmpty) {
        service.send({ type: HarvesterEventType.deposited })
        return { continue: true, state: SharedCreepState.idle }
    }

    const spawnStorage = creep.room.find(FIND_MY_SPAWNS)[0]

    if (!spawnStorage) {
        console.log(`Spawn not found for creep ${creep.name}`)

        service.send({ type: HarvesterEventType.deposited })

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
    return  { continue: false, state: HarvesterState.depositing }
}