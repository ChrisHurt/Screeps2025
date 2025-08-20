
import { Service } from "robot3"
import { GuardMachine, GuardMachineStateTypes } from "stateMachines/guard-machine"
import { SharedCreepEventType, SharedCreepState } from "types"

interface GuardInput {
    creep: Creep
    service: Service<GuardMachine>
}

interface GuardOutput {
    continue: boolean
    state: GuardMachineStateTypes
}

export const basicMeleeAttack = ({ creep, service }: GuardInput): GuardOutput => {

    // Check for attack parts
    const hasAttackParts = creep.body.some(part => part.type === ATTACK && part.hits > 0)
    if (!hasAttackParts) {
        service.send({ type: SharedCreepEventType.recycleSelf })
        return { continue: true, state: SharedCreepState.recycling }
    }

    // Pursue nearest enemy creep
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS)
    const nearest = creep.pos.findClosestByRange(hostiles)
    if (nearest) {
        if (creep.pos.getRangeTo(nearest) > 1) {
            creep.moveTo(nearest, { visualizePathStyle: { stroke: '#ff0000' } })
        }
    }
    // Attack weakest enemy creep in range
    const inRange = hostiles.filter(h => creep.pos.getRangeTo(h) === 1)
    if (inRange.length > 0) {
        const weakest = inRange.reduce((a, b) => a.hits < b.hits ? a : b)
        creep.attack(weakest)
    }
    // If no hostiles remain after attack, transition
    const stillHostiles = creep.room.find(FIND_HOSTILE_CREEPS)
    if (!stillHostiles || stillHostiles.length === 0) {
        service.send({ type: SharedCreepEventType.hostilesNeutralised })
        return { continue: true, state: SharedCreepState.idle }
    }
    return { continue: false, state: SharedCreepState.attacking }
}