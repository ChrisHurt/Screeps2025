interface IncidentalMaintenanceInput {
    creep: Creep
    creepIsApproachingFullEnergy: boolean
    creepRepairAmountPerTick: number
    creepPosition: RoomPosition
}

export const incidentalMaintenance = ({ creep, creepPosition, creepIsApproachingFullEnergy, creepRepairAmountPerTick }: IncidentalMaintenanceInput): void => {
    const closestBuildSite = creepPosition.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)
    const buildSiteIsInRange = closestBuildSite && creepPosition.inRangeTo(closestBuildSite, 3)

    if(buildSiteIsInRange && creepIsApproachingFullEnergy) {
        creep.build(closestBuildSite)
        return
    }

    const closestRepairSite = creepPosition.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => structure.hitsMax - structure.hits > creepRepairAmountPerTick
    })

    const repairSiteIsInRange = closestRepairSite && creepPosition.inRangeTo(closestRepairSite, 3)

    if (repairSiteIsInRange) creep.repair(closestRepairSite)
}
