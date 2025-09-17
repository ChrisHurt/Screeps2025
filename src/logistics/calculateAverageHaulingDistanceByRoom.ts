import { Position, RoomName } from "types"
import { RankedConsumersByRoom, StoresByRoom } from "./discoverLogisticTasks"

interface CalculationInput {
    rankedConsumersByRoom: RankedConsumersByRoom
    rankedStoresByRoom: StoresByRoom
    roomNames: RoomName[]
}

type CalculationOutput = Record<RoomName, number>

export function calculateAverageHaulingDistanceByRoom({
    rankedConsumersByRoom,
    rankedStoresByRoom,
    roomNames
}: CalculationInput): CalculationOutput {
    return roomNames.reduce<Record<RoomName, number>>((acc, roomName) => {
        let totalWeightedDistance = 0
        let totalEnergyFlow = 0
        for (const store of rankedStoresByRoom[roomName] || []) {
            const storeEnergySupply = store.energy.current
            const consumersOfRoom = rankedConsumersByRoom[roomName]
            for (const consumer of [...consumersOfRoom.overdueConsumers, ...consumersOfRoom.dueConsumers]) {
                const consumerEnergyDemand = consumer.energy.capacity - consumer.energy.current
                if (consumerEnergyDemand <= 0) continue

                const distance = calculateDistance(store.pos, consumer.pos)
                const potentialFlow = Math.min(storeEnergySupply, consumerEnergyDemand)
                const weightedDistance = distance * potentialFlow

                totalWeightedDistance += weightedDistance
                totalEnergyFlow += potentialFlow
            }
        }
        acc[roomName] = totalEnergyFlow > 0 ? totalWeightedDistance / totalEnergyFlow : 10
        return acc
    }, {})
}

const calculateDistance = (pos1: Position, pos2: Position): number => {
    return pos1 === undefined && pos2 === undefined ? 0 : Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
}
