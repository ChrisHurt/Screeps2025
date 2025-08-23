import { Service } from "robot3"
import { HarvesterContext, HarvesterMachine } from "stateMachines/harvester-machine"
import { SharedCreepEventType, SharedCreepState } from "types"
// import { EnergyReservationsManager } from "energyReservationsManager"

interface DepositEnergyWithReservationsParams {
    creep: Creep
    context: HarvesterContext
    service: Service<HarvesterMachine>
}

interface DepositEnergyWithReservationsOutput {
    continue: boolean
    state: SharedCreepState.idle | SharedCreepState.depositing | SharedCreepState.error | SharedCreepState.recycling
}

export const depositEnergyWithReservations = ({
    creep, 
    context, 
    service
}: DepositEnergyWithReservationsParams): DepositEnergyWithReservationsOutput => {
    const isEmpty = context.energy === 0
    if (isEmpty) {
        service.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.idle }
    }

    const room = creep.room
    const energyToDeposit = context.energy
    const manager = new EnergyReservationsManager(room)

    // Clean up expired reservations
    manager.cleanupExpiredReservations()

    // Find the best deposit target using the reservation system
    const depositTarget = findBestDepositTarget(creep, manager, energyToDeposit)
    
    if (!depositTarget) {
        // Fallback to spawn if no other target is available
        return depositToSpawn(creep, context, service)
    }

    // Move to and deposit energy to the target
    const target = Game.getObjectById(depositTarget.id as Id<Structure>)
    if (!target) {
        console.log(`Deposit target not found: ${depositTarget.id}`)
        return depositToSpawn(creep, context, service)
    }

    if (!creep.pos.isNearTo(target.pos)) {
        creep.moveTo(target.pos.x, target.pos.y, { 
            reusePath: 5, 
            visualizePathStyle: { stroke: '#fff' } 
        })
        return { continue: false, state: SharedCreepState.depositing }
    }

    // We're adjacent to the target, perform the transfer
    const transferAmount = Math.min(energyToDeposit, depositTarget.capacity)
    
    if (target instanceof StructureSpawn || 
        target instanceof StructureExtension ||
        target instanceof StructureContainer ||
        target instanceof StructureStorage ||
        target instanceof StructureTerminal) {
        
        const result = creep.transfer(target, RESOURCE_ENERGY, transferAmount)
        
        if (result === OK) {
            // Handle spawn renewal if it's a spawn
            if (target instanceof StructureSpawn && 
                !target.spawning && 
                creep.ticksToLive && 
                creep.ticksToLive < CREEP_LIFE_TIME - 200) {
                target.renewCreep(creep)
            }
            
            // Clean up any supply reservation this creep might have
            if (creep.memory.energyReservationId) {
                manager.removeReservation(creep.memory.energyReservationId)
                delete creep.memory.energyReservationId
            }
            
            const remainingEnergy = creep.store.getUsedCapacity(RESOURCE_ENERGY)
            if (remainingEnergy === 0) {
                service.send({ type: SharedCreepEventType.empty })
                return { continue: true, state: SharedCreepState.idle }
            }
        }
    }

    return { continue: false, state: SharedCreepState.depositing }
}

interface DepositTarget {
    id: string
    priority: number
    capacity: number // How much energy this target can accept
    distance: number
    type: 'spawn' | 'extension' | 'container' | 'storage'
}

function findBestDepositTarget(
    creep: Creep, 
    manager: EnergyReservationsManager, 
    energyAmount: number
): DepositTarget | null {
    const room = creep.room
    const candidates: DepositTarget[] = []

    // Priority 1: Spawn and Extensions (for energy production)
    const spawnsAndExtensions = room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType === STRUCTURE_SPAWN || 
                    structure.structureType === STRUCTURE_EXTENSION) &&
                   structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }
    }) as (StructureSpawn | StructureExtension)[]

    for (const structure of spawnsAndExtensions) {
        candidates.push({
            id: structure.id,
            priority: 1,
            capacity: structure.store.getFreeCapacity(RESOURCE_ENERGY),
            distance: creep.pos.getRangeTo(structure),
            type: structure.structureType === STRUCTURE_SPAWN ? 'spawn' : 'extension'
        })
    }

    // Priority 2: Controller containers (for upgraders)
    const containers = room.find(FIND_STRUCTURES, {
        filter: (structure): structure is StructureContainer => {
            return structure.structureType === STRUCTURE_CONTAINER &&
                   structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }
    })

    const roomMemory = Memory.rooms[room.name]
    for (const container of containers) {
        let priority = 4 // Default storage priority
        let type: 'container' = 'container'

        // Check if this is a controller container (higher priority)
        if (roomMemory?.structures?.containers?.controller) {
            const cc = roomMemory.structures.containers.controller
            if (cc.position.x === container.pos.x && cc.position.y === container.pos.y) {
                priority = 2 // Higher priority for controller containers
            }
        }

        // Check if this is a source container (lower priority since harvesters should deposit elsewhere)
        if (roomMemory?.structures?.containers?.sources) {
            const sourceContainers = Object.values(roomMemory.structures.containers.sources)
            const isSourceContainer = sourceContainers.some(sc => 
                sc.position.x === container.pos.x && 
                sc.position.y === container.pos.y
            )
            if (isSourceContainer) {
                priority = 5 // Lower priority for source containers
            }
        }

        candidates.push({
            id: container.id,
            priority,
            capacity: container.store.getFreeCapacity(RESOURCE_ENERGY),
            distance: creep.pos.getRangeTo(container),
            type
        })
    }

    // Priority 3: Storage structures
    const storageStructures = room.find(FIND_MY_STRUCTURES, {
        filter: (structure): structure is StructureStorage => {
            return structure.structureType === STRUCTURE_STORAGE &&
                   structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }
    })

    for (const storage of storageStructures) {
        candidates.push({
            id: storage.id,
            priority: 3,
            capacity: storage.store.getFreeCapacity(RESOURCE_ENERGY),
            distance: creep.pos.getRangeTo(storage),
            type: 'storage'
        })
    }

    if (candidates.length === 0) {
        return null
    }

    // Sort by priority (lower number = higher priority), then by distance
    candidates.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority
        }
        return a.distance - b.distance
    })

    // Return the best candidate that can accept the energy
    return candidates.find(candidate => candidate.capacity >= energyAmount) || candidates[0]
}

function depositToSpawn(
    creep: Creep,
    context: HarvesterContext,
    service: Service<HarvesterMachine>
): DepositEnergyWithReservationsOutput {
    // Fallback to the original spawn deposit logic
    const spawnStorage = creep.room.find(FIND_MY_SPAWNS)[0]

    if (!spawnStorage) {
        console.log(`Spawn not found for creep ${creep.name}`)
        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    if (!creep.pos.isNearTo(spawnStorage)) {
        creep.moveTo(spawnStorage.pos.x, spawnStorage.pos.y, { 
            reusePath: 5, 
            visualizePathStyle: { stroke: '#fff' } 
        })
    }

    if (creep.pos.inRangeTo(spawnStorage, 1)) {
        creep.transfer(spawnStorage, RESOURCE_ENERGY)
        if (!spawnStorage.spawning && 
            creep.ticksToLive && 
            creep.ticksToLive < CREEP_LIFE_TIME - 200) {
            spawnStorage.renewCreep(creep)
        }
        return { continue: true, state: SharedCreepState.idle }
    }
    
    return { continue: false, state: SharedCreepState.depositing }
}
