interface IncidentalMaintenanceInput {
    creep: Creep
    creepPosition: RoomPosition
}

export const incidentalDeposit = ({ creep, creepPosition }: IncidentalMaintenanceInput): void => {
    const creepProduction = creep.getActiveBodyparts(WORK) * HARVEST_POWER
    const creepFreeCapacity = creep.store.getFreeCapacity()

    if(creepFreeCapacity - 1 > creepProduction) return

    const adjacentStore = creepPosition.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (structure) => "store" in structure && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    })

    if(adjacentStore && creepPosition.isNearTo(adjacentStore)) {
        creep.transfer(adjacentStore, RESOURCE_ENERGY)
    }
}
