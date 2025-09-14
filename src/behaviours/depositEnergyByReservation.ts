import { moveInRangeOfPos } from "behaviours/moveInRangeOfPos"
import { Service } from "robot3"
import { HarvesterContext, HarvesterMachine } from "stateMachines/harvester-machine"
import { SharedCreepEventType, SharedCreepState, CreepId, StructureId } from "types"

interface DepositEnergyByReservationContext extends HarvesterContext {
    recipient: CreepId | StructureId
    deliveryMethod: 'transfer' | 'drop'
    amountReserved: number
}

interface DepositEnergyByReservationInput {
    creep: Creep
    context: DepositEnergyByReservationContext
    service: Service<HarvesterMachine>
}

interface DepositEnergyByReservationOutput {
    continue: boolean
    state: SharedCreepState.idle | SharedCreepState.depositingEnergy | SharedCreepState.error | SharedCreepState.recycling
}

type EnergyRecipient =
    | StructureSpawn | StructureExtension | StructureTower
    | StructureStorage | StructureContainer | StructureTerminal
    | Creep

export const depositEnergyByReservation = ({
    creep,
    context,
    service,
}: DepositEnergyByReservationInput): DepositEnergyByReservationOutput => {
    const isEmpty = context.energy === 0

    if (isEmpty) {
        service.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.idle }
    }

    // Get the energy recipient from the context
    const recipient = Game.getObjectById(context.recipient as Id<EnergyRecipient>)
    
    if (!recipient) {
        console.log(`Energy recipient ${context.recipient} not found for creep ${creep.name}`)
        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    // Move towards the recipient if not in range
    if (!creep.pos.isNearTo(recipient.pos)) {
        moveInRangeOfPos({
            creep,
            moveParams: { reusePath: 5, visualizePathStyle: { stroke: '#ff00aa' } }, // Pink for reservation
            offset: 1,
            target: recipient.pos
        })
        return { continue: false, state: SharedCreepState.depositingEnergy }
    }

    // We're adjacent to the recipient, attempt to transfer energy
    // Assume creep has the energy for the reserved amount
    let transferResult: ScreepsReturnCode = ERR_INVALID_TARGET

    if (context.deliveryMethod === 'drop') {
        // Drop energy at the recipient's position
        transferResult = creep.drop(RESOURCE_ENERGY, context.amountReserved)
    } else if ('store' in recipient && 'structureType' in recipient) {
        // Structure with store
        transferResult = creep.transfer(recipient as Structure, RESOURCE_ENERGY, context.amountReserved)
        
        // Handle spawn renewal if transferring to spawn
        if (transferResult === OK && recipient.structureType === STRUCTURE_SPAWN && 
            'spawning' in recipient && !recipient.spawning && 
            creep.ticksToLive && 
            creep.ticksToLive < CREEP_LIFE_TIME - 200) {
            (recipient as StructureSpawn).renewCreep(creep)
        }
    } else if ('transfer' in recipient) {
        // Creep recipient
        transferResult = creep.transfer(recipient as Creep, RESOURCE_ENERGY, context.amountReserved)
    }

    if (transferResult === OK) {
        // Check if creep is now empty
        const remainingEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY)
        if (remainingEnergy === 0) {
            service.send({ type: SharedCreepEventType.empty })
            return { continue: true, state: SharedCreepState.idle }
        }
        
        // Still have energy, continue depositing
        return { continue: false, state: SharedCreepState.depositingEnergy }
        
    } else if (transferResult === ERR_FULL) {
        console.log(`Energy recipient ${context.recipient} is full for creep ${creep.name}`)
        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
        
    } else if (transferResult === ERR_NOT_ENOUGH_RESOURCES) {
        service.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.idle }
        
    } else {
        console.log(`Error depositing energy to ${context.recipient}: ${transferResult}`)
        return { continue: false, state: SharedCreepState.depositingEnergy }
    }
}
