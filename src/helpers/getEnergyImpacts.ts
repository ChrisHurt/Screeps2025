import { CreepEnergyImpact, StructureEnergyImpact } from "types"

export const getEnergyImpacts = (): Record<string, CreepEnergyImpact | StructureEnergyImpact> => {
    const energyImpacts: Record<string, CreepEnergyImpact | StructureEnergyImpact> = {}

    Object.entries(Memory.creeps).forEach(([creepId, creepMemory]) => {
        if (creepMemory.energyImpact) {
            energyImpacts[creepId] = creepMemory.energyImpact
        }
    })

    Object.entries(Memory.structures).forEach(([structureId, structureMemory]) => {
        if (structureMemory.energyImpact) {
            energyImpacts[structureId] = structureMemory.energyImpact
        }
    })

    return energyImpacts
}