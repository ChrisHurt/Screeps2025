
import { moveInRangeOfPos } from "behaviours/sharedCreepBehaviours/moveInRangeOfPos"
import { Service } from "robot3"
import { UpgraderContext, UpgraderEventType, UpgraderMachine, UpgraderState } from "stateMachines/upgrader-machine"
import { SharedCreepState } from "types"

interface CollectEnergyInput {
    creep: Creep
    context: UpgraderContext
    upgraderService: Service<UpgraderMachine>
}

interface CollectEnergyOutput {
    continue: boolean
    state: SharedCreepState | UpgraderState
}

export const collectEnergy = ({
    creep,
    context,
    upgraderService
}: CollectEnergyInput): CollectEnergyOutput => {
    const isFull = context.energy >= context.capacity

    if (isFull) {
        upgraderService.send({ type: UpgraderEventType.collected })
        return { continue: true, state: UpgraderState.upgrading }
    }

    const room = creep.room

    // TODO: Store all the energy collection tasks following in transient room memory
    const droppedEnergy = room.find(FIND_DROPPED_RESOURCES, { filter: resource=>resource.resourceType === RESOURCE_ENERGY })

    if (droppedEnergy.length > 0) {
        const closestDroppedEnergy = creep.pos.findClosestByPath(droppedEnergy)
        if (closestDroppedEnergy) {
            moveInRangeOfPos({
                creep,
                moveParams: { reusePath: 5, visualizePathStyle: { stroke: '#00ff00' } },
                offset: 1,
                target: closestDroppedEnergy.pos
            })

            const inRange = creep.pos.isNearTo(closestDroppedEnergy.pos)

            if (inRange) {
                creep.pickup(closestDroppedEnergy)

                const creepIsFull = creep.store.energy >= creep.store.getCapacity(RESOURCE_ENERGY)

                if (creepIsFull) {
                    upgraderService.send({ type: UpgraderEventType.collected })
                    return { continue: true, state: UpgraderState.upgrading }
                }
            }
            return { continue: false, state: UpgraderState.collecting }
        }
    }

    const tombstones = room.find(FIND_TOMBSTONES, { filter: tombstone => !!tombstone.store?.getCapacity(RESOURCE_ENERGY)})
    // TODO: Low frequency check
    const ruins = room.find(FIND_RUINS, { filter: ruin => !!ruin.store.getCapacity(RESOURCE_ENERGY) })
    const structureStores = room.find(FIND_STRUCTURES, { filter: structure => 'store' in structure && structure.store.getCapacity(RESOURCE_ENERGY) > 0 })

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

        const inRange = creep.pos.isNearTo(closestStore.pos)

        if (inRange) {
            creep.withdraw(closestStore, RESOURCE_ENERGY)

            const creepIsFull = creep.store.energy >= creep.store.getCapacity(RESOURCE_ENERGY)

            if (creepIsFull) {
                upgraderService.send({ type: UpgraderEventType.collected })
                return { continue: true, state: UpgraderState.upgrading }
            }
        }
    }

    return { continue: false, state: UpgraderState.collecting }
}