
import { moveInRangeOfPos } from "behaviours/moveInRangeOfPos"
import { Service } from "robot3"
import { BuilderMachine } from "stateMachines/builder-machine"
import { UpgraderContext, UpgraderMachine } from "stateMachines/upgrader-machine"
import { SharedCreepEventType, SharedCreepState } from "types"

interface CollectEnergyInput{
    creep: Creep
    context: UpgraderContext
    service: Service<BuilderMachine> | Service<UpgraderMachine>
}

interface CollectEnergyOutput {
    continue: boolean
    state: SharedCreepState.idle | SharedCreepState.collectingEnergy
}

type RetrievableStorage =
    | StructureSpawn    | StructureExtension    | StructureTower
    | StructureStorage  | StructureContainer    | StructureTerminal

export const collectEnergy = ({
    creep,
    context,
    service,
}: CollectEnergyInput): CollectEnergyOutput => {
    const isFull = context.energy >= context.capacity

    if (isFull) {
        service.send({ type: SharedCreepEventType.full })
        return { continue: true, state: SharedCreepState.idle }
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
                    service.send({ type: SharedCreepEventType.full })
                    return { continue: true, state: SharedCreepState.idle }
                }
            }
            return { continue: false, state: SharedCreepState.collectingEnergy }
        }
    }

    const tombstones = room.find(FIND_TOMBSTONES, { filter: tombstone => tombstone.store.getCapacity(RESOURCE_ENERGY)})
    const ruins = room.find(FIND_RUINS, { filter: ruin => !!ruin.store.getCapacity(RESOURCE_ENERGY) })
    const roomStructures = room.find(FIND_STRUCTURES) || []
    const structureStores = roomStructures.filter(structure =>
        "store" in structure && (structure as RetrievableStorage).store.getCapacity(RESOURCE_ENERGY)
    )

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