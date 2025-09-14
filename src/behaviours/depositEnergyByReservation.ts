import { Service } from "robot3"
import { SharedCreepEventType, SharedCreepState, CreepId } from "types"
import { clearReservationMemory } from "./clearReservationMemory"
import { renewAdjacentCarrier } from "./renewAdjacentCarrier"
import { HaulerContext, HaulerMachine } from "stateMachines/hauler-machine"

interface DepositEnergyByReservationContext extends HaulerContext {
    carrierId: CreepId
}

interface DepositEnergyByReservationInput {
    creep: Creep
    context: DepositEnergyByReservationContext
    service: Service<HaulerMachine>
}

interface DepositEnergyByReservationOutput {
    continue: boolean
    state:
    | SharedCreepState.idle | SharedCreepState.depositingEnergy
    | SharedCreepState.error | SharedCreepState.recycling
    | SharedCreepState.collectingEnergy
}

export const depositEnergyByReservation = ({
    creep,
    context,
    service,
}: DepositEnergyByReservationInput): DepositEnergyByReservationOutput => {
    const isEmpty = context.energy === 0

    if (isEmpty) {
        service.send({ type: SharedCreepEventType.empty })
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

    if (taskReservation.type !== 'deliverEnergy') {
        console.log(`Invalid reservation type ${taskReservation.type} for deposit energy behavior for creep ${creep.name}`)
        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    // Get the energy recipient from the reservation
    const destinationPosition = taskReservation.path[taskReservation.path.length - 1]
    const storeMemory = Memory.energyLogistics.stores[taskReservation.targetId]
    const store = Game.rooms[destinationPosition.roomName]?.lookForAt(LOOK_STRUCTURES, destinationPosition.x, destinationPosition.y).find(s => s.id === taskReservation.targetId)

    if (!store) {
        console.log(`Energy recipient ${taskReservation.targetId} not found for creep ${creep.name}`)

        clearReservationMemory({
            carrierMemory,
            storeMemory,
        })

        service.send({ type: SharedCreepEventType.idle })
        return { continue: true, state: SharedCreepState.idle }
    }

    const action = taskReservation.action

    if (!creep.pos.inRangeTo(store.pos, action === 'drop' ? 0 : 1)) {
        creep.moveByPath(taskReservation.path)
        return { continue: false, state: SharedCreepState.depositingEnergy }
    }

    // We're adjacent to the recipient, attempt to transfer energy
    // Use the amount and action from the reservation
    let transferResult: ScreepsReturnCode = ERR_INVALID_TARGET


    if (action === 'drop') {
        // Drop energy at the recipient's position
        transferResult = creep.drop(RESOURCE_ENERGY, taskReservation.amount)
    } else if (action === 'transfer') {
        transferResult = creep.transfer(store, RESOURCE_ENERGY, taskReservation.amount)
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

    if (transferResult === OK || transferResult === ERR_FULL || transferResult === ERR_NOT_ENOUGH_RESOURCES) {
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            service.send({ type: SharedCreepEventType.empty })
            return { continue: true, state: SharedCreepState.idle }
        }

        service.send({ type: SharedCreepEventType.idle })
        return { continue: false, state: SharedCreepState.idle }
    } else {
        console.log(`Error depositing energy to ${taskReservation.targetId}: ${transferResult}`)
        return { continue: false, state: SharedCreepState.depositingEnergy }
    }
}
