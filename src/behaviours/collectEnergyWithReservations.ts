import { moveInRangeOfPos } from "behaviours/moveInRangeOfPos"
import { Service } from "robot3"
import { BuilderMachine } from "stateMachines/builder-machine"
import { UpgraderContext, UpgraderMachine } from "stateMachines/upgrader-machine"
import { SharedCreepEventType, SharedCreepState } from "types"
import { EnergyReservation, EnergyReservationStatus } from "types-energy-reservations"
import { 
    findEnergySourceWithReservations,
    createDemandReservation,
    matchReservationWithSource,
    cleanupExpiredReservations,
    removeEnergyReservation,
    getAllEnergyReservations
} from "../energyReservationsFunctions"

interface CollectEnergyWithReservationsInput {
    creep: Creep
    context: UpgraderContext
    service: Service<BuilderMachine> | Service<UpgraderMachine>
}

interface CollectEnergyWithReservationsOutput {
    continue: boolean
    state: SharedCreepState.idle | SharedCreepState.collectingEnergy
}

type RetrievableStorage =
    | StructureSpawn    | StructureExtension    | StructureTower
    | StructureStorage  | StructureContainer    | StructureTerminal

/**
 * Functional approach to collect energy with reservations
 */
export function collectEnergyWithReservations(input: CollectEnergyWithReservationsInput): CollectEnergyWithReservationsOutput {
    const { creep, context, service } = input
    
    // Clean up expired reservations first
    cleanupExpiredReservations(creep.room.name)
    
    const energyNeeded = creep.store.getFreeCapacity(RESOURCE_ENERGY)
    
    if (energyNeeded === 0) {
        // Creep is full, clean up reservation and transition
        if (creep.memory.energyReservationId) {
            removeEnergyReservation(creep.room.name, creep.memory.energyReservationId)
            delete creep.memory.energyReservationId
        }
        service.send({ type: SharedCreepEventType.full })
        return { continue: true, state: SharedCreepState.idle }
    }
    
    // Execute energy reservation if we have one
    if (creep.memory.energyReservationId) {
        const reservations = getAllEnergyReservations(creep.room.name)
        const reservation = reservations.find(r => r.id === creep.memory.energyReservationId)
        
        if (reservation) {
            const result = executeEnergyReservation(creep, reservation, service)
            if (result.continue || result.state !== SharedCreepState.collectingEnergy) {
                return result
            }
        }
        
        // Reservation failed or doesn't exist, clean up
        removeEnergyReservation(creep.room.name, creep.memory.energyReservationId)
        delete creep.memory.energyReservationId
    }
    
    // Create a new demand reservation if we don't have one
    if (!creep.memory.energyReservationId && energyNeeded > 0) {
        creep.memory.energyReservationId = createDemandReservation(creep, energyNeeded)
    }
    
    // Try to find an energy source using reservation-aware logic
    const energySource = findEnergySourceWithReservations(creep, Math.min(energyNeeded, 50))
    
    if (energySource.type && energySource.id) {
        // Try to match with the found source
        if (creep.memory.energyReservationId) {
            matchReservationWithSource(creep.room.name, creep.memory.energyReservationId, energySource.id)
        }
        
        if (Game.flags.debug) {
            console.log(`${creep.name}: Found ${energySource.type} ${energySource.id} with ${energySource.amount} energy`)
        }
    } else {
        // No energy source available, try fallback collection
        return fallbackEnergyCollection(creep, context, service, creep.room)
    }
    
    return { continue: false, state: SharedCreepState.collectingEnergy }
}

/**
 * Execute a specific energy reservation
 */
function executeEnergyReservation(
    creep: Creep, 
    reservation: EnergyReservation, 
    service: Service<BuilderMachine> | Service<UpgraderMachine>
): CollectEnergyWithReservationsOutput {
    if (!reservation.sourceId) {
        removeEnergyReservation(creep.room.name, reservation.id)
        delete creep.memory.energyReservationId
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }

    // Try to get the energy source (container or creep)
    const energySource = Game.getObjectById(reservation.sourceId as Id<Structure | Creep>)
    
    if (!energySource) {
        console.log(`Energy source ${reservation.sourceId} not found for reservation ${reservation.id}`)
        removeEnergyReservation(creep.room.name, reservation.id)
        delete creep.memory.energyReservationId
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }

    // Move towards the energy source
    if (!creep.pos.isNearTo(energySource.pos)) {
        moveInRangeOfPos({
            creep,
            moveParams: { reusePath: 5, visualizePathStyle: { stroke: '#ffff00' } }, // Yellow for reserved energy
            offset: 1,
            target: energySource.pos
        })
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }

    // We're adjacent to the energy source, attempt to withdraw energy
    let withdrawResult: ScreepsReturnCode = ERR_INVALID_TARGET
    let actualAmountToWithdraw = 0
    
    if (energySource instanceof StructureContainer || 
        energySource instanceof StructureStorage ||
        energySource instanceof StructureSpawn ||
        energySource instanceof StructureExtension ||
        energySource instanceof StructureTerminal) {
        
        const availableEnergy = energySource.store.getUsedCapacity(RESOURCE_ENERGY)
        const creepFreeCapacity = creep.store.getFreeCapacity(RESOURCE_ENERGY)
        actualAmountToWithdraw = Math.min(reservation.amount, availableEnergy, creepFreeCapacity)
        
        if (actualAmountToWithdraw > 0) {
            withdrawResult = creep.withdraw(energySource, RESOURCE_ENERGY, actualAmountToWithdraw)
            
            // Handle spawn renewal if withdrawing from spawn
            if (withdrawResult === OK && energySource instanceof StructureSpawn && 
                !energySource.spawning && 
                creep.ticksToLive && 
                creep.ticksToLive < CREEP_LIFE_TIME - 200) {
                energySource.renewCreep(creep)
            }
        }
    } else if (energySource instanceof Creep) {
        console.log(`Creep-to-creep energy transfer not yet implemented for reservation ${reservation.id}`)
        removeEnergyReservation(creep.room.name, reservation.id)
        delete creep.memory.energyReservationId
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }

    if (withdrawResult === OK) {
        // Successfully withdrew energy, clean up the reservation
        removeEnergyReservation(creep.room.name, reservation.id)
        delete creep.memory.energyReservationId
        
        // Check if creep is now full
        const creepIsFull = creep.store.energy >= creep.store.getCapacity(RESOURCE_ENERGY)
        if (creepIsFull) {
            service.send({ type: SharedCreepEventType.full })
            return { continue: true, state: SharedCreepState.idle }
        }
        
        // Still have capacity, continue collecting
        return { continue: false, state: SharedCreepState.collectingEnergy }
        
    } else if (withdrawResult === ERR_NOT_ENOUGH_RESOURCES) {
        console.log(`Energy source ${reservation.sourceId} doesn't have enough energy for reservation ${reservation.id}`)
        removeEnergyReservation(creep.room.name, reservation.id)
        delete creep.memory.energyReservationId
        return { continue: false, state: SharedCreepState.collectingEnergy }
        
    } else if (withdrawResult === ERR_FULL) {
        removeEnergyReservation(creep.room.name, reservation.id)
        delete creep.memory.energyReservationId
        service.send({ type: SharedCreepEventType.full })
        return { continue: true, state: SharedCreepState.idle }
        
    } else {
        console.log(`Error executing energy reservation ${reservation.id}: ${withdrawResult}`)
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }
}

/**
 * Fallback energy collection for when reservations fail
 */
function fallbackEnergyCollection(
    creep: Creep,
    context: UpgraderContext,
    service: Service<BuilderMachine> | Service<UpgraderMachine>,
    room: Room
): CollectEnergyWithReservationsOutput {
    const tombstones = room.find(FIND_TOMBSTONES, { 
        filter: tombstone => tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 0
    })

    const ruins = room.find(FIND_RUINS, { 
        filter: ruin => ruin.store.getUsedCapacity(RESOURCE_ENERGY) > 0 
    })

    const roomStructures = room.find(FIND_STRUCTURES) || []
    const structureStores = roomStructures.filter(structure =>
        "store" in structure && 
        (structure as RetrievableStorage).store.getUsedCapacity(RESOURCE_ENERGY) > 0 &&
        (structure.structureType === STRUCTURE_SPAWN || 
         structure.structureType === STRUCTURE_EXTENSION ||
         structure.structureType === STRUCTURE_STORAGE ||
         structure.structureType === STRUCTURE_TERMINAL)
    ) as RetrievableStorage[]

    const energyStorages = [
        ...tombstones,
        ...ruins,
        ...structureStores
    ]

    const closestStore = creep.pos.findClosestByPath(energyStorages)
    if (closestStore) {
        moveInRangeOfPos({
            creep,
            moveParams: { reusePath: 5, visualizePathStyle: { stroke: '#00ff00' } },
            offset: 1,
            target: closestStore.pos
        })

        if (creep.pos.isNearTo(closestStore.pos)) {
            creep.withdraw(closestStore, RESOURCE_ENERGY)

            if ("renewCreep" in closestStore) {
                closestStore.renewCreep(creep)
            }

            const creepIsFull = creep.store.energy >= creep.store.getCapacity(RESOURCE_ENERGY)
            if (creepIsFull) {
                service.send({ type: SharedCreepEventType.full })
                return { continue: true, state: SharedCreepState.idle }
            }
        }
    }

    return { continue: false, state: SharedCreepState.collectingEnergy }
}
