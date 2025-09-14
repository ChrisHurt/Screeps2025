import { moveInRangeOfPos } from "behaviours/moveInRangeOfPos"
import { Service } from "robot3"
import { BuilderMachine } from "stateMachines/builder-machine"
import { UpgraderContext, UpgraderMachine } from "stateMachines/upgrader-machine"
import { SharedCreepEventType, SharedCreepState, CreepId, StructureId } from "types"

interface CollectEnergyByReservationContext extends UpgraderContext {
    supplier: CreepId | StructureId
    amountReserved: number
}

interface CollectEnergyByReservationInput {
    creep: Creep
    context: CollectEnergyByReservationContext
    service: Service<BuilderMachine> | Service<UpgraderMachine>
}

interface CollectEnergyByReservationOutput {
    continue: boolean
    state: SharedCreepState.idle | SharedCreepState.collectingEnergy
}

type EnergySupplier =
    | StructureSpawn | StructureExtension | StructureTower
    | StructureStorage | StructureContainer | StructureTerminal
    | Creep

export const collectEnergyByReservation = ({
    creep,
    context,
    service,
}: CollectEnergyByReservationInput): CollectEnergyByReservationOutput => {
    const isFull = context.energy >= context.capacity

    if (isFull) {
        service.send({ type: SharedCreepEventType.full })
        return { continue: true, state: SharedCreepState.idle }
    }

    // Get the energy supplier from the context
    const supplier = Game.getObjectById(context.supplier as Id<EnergySupplier>)
    
    if (!supplier) {
        console.log(`Energy supplier ${context.supplier} not found for creep ${creep.name}`)
        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    // Move towards the supplier if not in range
    if (!creep.pos.isNearTo(supplier.pos)) {
        moveInRangeOfPos({
            creep,
            moveParams: { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } }, // Orange for reservation
            offset: 1,
            target: supplier.pos
        })
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }

    // We're adjacent to the supplier, attempt to withdraw energy
    // Assume creep has capacity for the reserved amount
    let withdrawResult: ScreepsReturnCode = ERR_INVALID_TARGET

    if ('store' in supplier && 'structureType' in supplier) {
        // Structure with store
        withdrawResult = creep.withdraw(supplier as Structure, RESOURCE_ENERGY, context.amountReserved)
        
        // Handle spawn renewal if withdrawing from spawn
        if (withdrawResult === OK && supplier.structureType === STRUCTURE_SPAWN && 
            'spawning' in supplier && !supplier.spawning && 
            creep.ticksToLive && 
            creep.ticksToLive < CREEP_LIFE_TIME - 200) {
            (supplier as StructureSpawn).renewCreep(creep)
        }
    } else if ('transfer' in supplier) {
        // Creep supplier
        withdrawResult = supplier.transfer(creep, RESOURCE_ENERGY, context.amountReserved)
    }

    if (withdrawResult === OK) {
        // Check if creep is now full
        const creepIsFull = creep.store.energy >= creep.store.getCapacity(RESOURCE_ENERGY)
        if (creepIsFull) {
            service.send({ type: SharedCreepEventType.full })
            return { continue: true, state: SharedCreepState.idle }
        }
        
        // Still have capacity, continue collecting
        return { continue: false, state: SharedCreepState.collectingEnergy }
        
    } else if (withdrawResult === ERR_NOT_ENOUGH_RESOURCES) {
        console.log(`Energy supplier ${context.supplier} doesn't have enough energy for creep ${creep.name}`)
        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
        
    } else if (withdrawResult === ERR_FULL) {
        service.send({ type: SharedCreepEventType.full })
        return { continue: true, state: SharedCreepState.idle }
        
    } else {
        console.log(`Error collecting energy from ${context.supplier}: ${withdrawResult}`)
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }
}
