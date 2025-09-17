import { StructureName } from "types"

export const deleteStructureFromMemory = (structureName: StructureName) => {
    delete Memory.structures[structureName]

    // Safely delete production energy data
    if (Memory.production?.energy && structureName in Memory.production.energy) {
        delete Memory.production.energy[structureName]
    }

    // Safely delete reservations
    if (Memory.reservations?.energy && structureName in Memory.reservations.energy) {
        delete Memory.reservations.energy[structureName]
    }

    const energyLogisticsMemory = Memory.energyLogistics

    // Safely delete from energy logistics consumers
    if (energyLogisticsMemory?.consumers && structureName in energyLogisticsMemory.consumers) {
        delete energyLogisticsMemory.consumers[structureName]
    }

    // Safely delete from energy logistics producers
    if (energyLogisticsMemory?.producers && structureName in energyLogisticsMemory.producers) {
        delete energyLogisticsMemory.producers[structureName]
    }

    if (energyLogisticsMemory?.stores && structureName in energyLogisticsMemory.stores) {
        delete energyLogisticsMemory.stores[structureName]
    }
}