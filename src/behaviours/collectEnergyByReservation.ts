import { Service } from "robot3"
import { BuilderMachine } from "stateMachines/builder-machine"
import { UpgraderMachine } from "stateMachines/upgrader-machine"
import { SharedCreepEventType, SharedCreepState, CreepId } from "types"
import { renewAdjacentCarrier } from "./renewAdjacentCarrier"
import { clearReservationMemory } from "./clearReservationMemory"
import { HaulerContext, HaulerMachine } from "stateMachines/hauler-machine"

interface CollectEnergyByReservationContext extends HaulerContext {
    carrierId: CreepId
}

interface CollectEnergyByReservationInput {
    creep: Creep
    context: CollectEnergyByReservationContext
    service: Service<BuilderMachine> | Service<UpgraderMachine> | Service<HaulerMachine>
}

interface CollectEnergyByReservationOutput {
    continue: boolean
    state: SharedCreepState.idle | SharedCreepState.collectingEnergy
}

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

    // Get the carrier reservation from Memory
    const carrierMemory = Memory.energyLogistics?.carriers?.[context.carrierId]
    const taskReservation = carrierMemory?.reservation

    if (!taskReservation) {
        console.log(`No reservation found for carrier ${context.carrierId} for creep ${creep.name}`)
        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    if (taskReservation.type !== 'collectEnergy') {
        console.log(`Invalid reservation type ${taskReservation.type} for collect energy behavior for creep ${creep.name}`)
        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    // Get the energy supplier from the reservation
    const destinationPosition = taskReservation.path[taskReservation.path.length - 1]

    const storeMemory = Memory.energyLogistics.stores[taskReservation.targetId]
    const store = Game.rooms[destinationPosition.roomName]?.lookForAt(LOOK_STRUCTURES, destinationPosition.x, destinationPosition.y).find(s => s.id === taskReservation.targetId)

    if (!store) {
        console.log(`Store ${taskReservation.targetId} not found for creep ${creep.name}`)

        clearReservationMemory({
            carrierMemory,
            storeMemory,
        })

        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    // Move towards the supplier if not in range
    if (!creep.pos.isNearTo(store.pos)) {
        creep.moveByPath(taskReservation.path)
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }

    let withdrawResult: ScreepsReturnCode = ERR_INVALID_TARGET

    const action = taskReservation.action

    if (action === 'pickup') {
        // Find dropped resources near the supplier
        const droppedEnergy = store.pos.findInRange(FIND_DROPPED_RESOURCES, 0, {
            filter: (resource) => resource.resourceType === RESOURCE_ENERGY
        })[0]

        withdrawResult = droppedEnergy ? creep.pickup(droppedEnergy) : ERR_NOT_FOUND
    } else if (action === 'withdraw') {
        // Creep supplier
        withdrawResult = creep.withdraw(store, RESOURCE_ENERGY, taskReservation.amount)
    }

    if ('spawning' in store) {
        renewAdjacentCarrier({
            carrierMemory, creep, spawn: store as StructureSpawn
        })
    }

    clearReservationMemory({
        carrierMemory,
        storeMemory,
    })

    if (withdrawResult === OK || withdrawResult === ERR_FULL || withdrawResult === ERR_NOT_ENOUGH_RESOURCES) {
        if (withdrawResult === ERR_FULL || creep.store.getUsedCapacity(RESOURCE_ENERGY) >= carrierMemory.energy.capacity) {
            service.send({ type: SharedCreepEventType.full })
            return { continue: false, state: SharedCreepState.idle }
        }

        service.send({ type: SharedCreepEventType.idle })
        return { continue: false, state: SharedCreepState.idle }
    } else {
        console.log(`Error collecting energy from ${taskReservation.targetId}: ${withdrawResult}`)
        return { continue: false, state: SharedCreepState.collectingEnergy }
    }
}
