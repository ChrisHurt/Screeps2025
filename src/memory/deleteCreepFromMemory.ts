import { CreepEnergyImpact, EnergyImpactType, StructureEnergyImpact, StructureName, CreepBuildTask, CreepUpgradeTask, CreepHarvestTask } from "types"


/**
 * Gets all tasks from consolidated memory locations (Memory.creeps[].task)
 * Falls back to Memory.reservations.tasks for backwards compatibility
 */
export const getAllCreepTasks = (): Record<string, CreepBuildTask | CreepUpgradeTask | CreepHarvestTask> => {
    const tasks: Record<string, CreepBuildTask | CreepUpgradeTask | CreepHarvestTask> = {}
    
    // Get from creep memory
    Object.entries(Memory.creeps).forEach(([creepId, creepMemory]) => {
        if (creepMemory.task) {
            tasks[creepId] = creepMemory.task
        }
    })
    
    // Fallback to old location for backwards compatibility
    if (Memory.reservations?.tasks) {
        Object.entries(Memory.reservations.tasks).forEach(([creepId, task]) => {
            if (!tasks[creepId]) {
                tasks[creepId] = task
            }
        })
    }
    
    return tasks
}

export const deleteCreepFromMemory = (creepName: string) => {
    // Delete from Memory.creeps
    if (Memory.creeps && creepName in Memory.creeps) {
        delete Memory.creeps[creepName]
    }

    // Safely delete reservations
    if (Memory.reservations?.energy && creepName in Memory.reservations.energy) {
        delete Memory.reservations.energy[creepName]
    }

    if (Memory.reservations?.tasks && creepName in Memory.reservations.tasks) {
        delete Memory.reservations.tasks[creepName]
    }

    // Safely delete energy logistics carriers
    if (Memory.energyLogistics?.carriers && creepName in Memory.energyLogistics.carriers) {
        delete Memory.energyLogistics.carriers[creepName]
    }

    // Safely delete from energy logistics consumers
    if (Memory.energyLogistics?.consumers && creepName in Memory.energyLogistics.consumers) {
        delete Memory.energyLogistics.consumers[creepName]
    }

    // Safely delete from energy logistics producers
    if (Memory.energyLogistics?.producers && creepName in Memory.energyLogistics.producers) {
        delete Memory.energyLogistics.producers[creepName]
    }

    const storeMemory = Memory.energyLogistics?.stores

    // Safely delete store reservations (only for this specific creep)
    if (storeMemory) {
        for (const storeName in storeMemory) {
            const store = storeMemory[storeName]
            if (store.reservations && creepName in store.reservations) {
                delete store.reservations[creepName]
            }
        }
    }
}