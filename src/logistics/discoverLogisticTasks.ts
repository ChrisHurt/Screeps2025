
import { calculateAverageHaulingDistanceByRoom } from "logistics/calculateAverageHaulingDistanceByRoom"
import { Carrier, Consumer, RoomName, Store } from "types"

interface CarriersByLoad {
    fullCarriers: Carrier[]
    emptyCarriers: Carrier[]
}

interface CarriersByRoom {
    [roomName: RoomName]: {
        active: CarriersByLoad
        idle: CarriersByLoad
        totalCapacity: number
    }
}

export interface RankedConsumersByRoom {
    [roomName: RoomName]: {
        dueConsumers: Consumer[],
        overdueConsumers: Consumer[],
        totalEnergyDemand: number
    }
}

export interface StoresByRoom {
    [roomName: RoomName]: Store[]
}

interface LogisticsTasks {
    averageHaulingDistancePerRoom: Record<RoomName, number>
    carriersByRoom: CarriersByRoom
    dynamicEnergyDemandByRoom: Record<RoomName, number>
    dynamicEnergySupplyByRoom: Record<RoomName, number>
    consumersByRoom: RankedConsumersByRoom
    storesByRoom: StoresByRoom
}

export const discoverLogisticTasks = (): LogisticsTasks => {
    const energyLogistics = Memory.energyLogistics
    const consumers = Object.values(energyLogistics.consumers)
    const stores = Object.values(energyLogistics.stores)
    const carriers = Object.values(energyLogistics.carriers)

    // NOTE: When considering war-time implementations, leverage the roomStates data
    const roomStates = Object.values(energyLogistics.roomStates)

    const carriersByRoom = Object.values(carriers).reduce<CarriersByRoom>((acc, carrier) => {
        const roomName = carrier.roomName
        const taskType = carrier.reservation?.type
        if (!acc[roomName]) {
            acc[roomName] = {
                active: {
                    fullCarriers: [],
                    emptyCarriers: []
                },
                idle: {
                    fullCarriers: [],
                    emptyCarriers: []
                },
                totalCapacity: 0
            }
        }

        if (carrier.energy.current > 0) {
            if (taskType === 'deliverEnergy') {
                acc[roomName].active.fullCarriers.push(carrier)
            } else if (!taskType) {
                acc[roomName].idle.fullCarriers.push(carrier)
            }
        } else {
            if (taskType === 'collectEnergy') {
                acc[roomName].active.emptyCarriers.push(carrier)
            } else if (!taskType) {
                acc[roomName].idle.emptyCarriers.push(carrier)
            }
        }
        acc[roomName].totalCapacity += carrier.energy.capacity
        return acc
    }, {})

    const consumerDemandByRoom = Object.entries(consumers).reduce<Record<RoomName,{ dueConsumers: Consumer[], overdueConsumers: Consumer[], totalDemand: number }>>((acc, [name, consumer]) => {
        const roomName = consumer.roomName
        if (!acc[roomName]) {
            acc[roomName] = { dueConsumers: [], overdueConsumers: [], totalDemand: 0 }
        }

        if (Game.time > consumer.depositTiming.earliestTick) {
            acc[roomName].overdueConsumers.push(consumer)
        } else if (Game.time > consumer.depositTiming.latestTick) {
            acc[roomName].dueConsumers.push(consumer)
        }

        acc[roomName].totalDemand += consumer.productionPerTick
        return acc
    }, {})

    const rankedConsumersByRoom = Object.entries(consumerDemandByRoom).reduce<RankedConsumersByRoom>((acc, [roomName, { overdueConsumers, dueConsumers }]) => {
        const dueConsumersFiltered = dueConsumers.filter(consumer => consumer.energy.capacity - consumer.energy.current < 50).sort((a, b) => b.urgency.peace - a.urgency.peace)
        const overdueConsumersFiltered = overdueConsumers.filter(consumer => consumer.energy.capacity - consumer.energy.current > 50).sort((a, b) => b.urgency.peace - a.urgency.peace)
        const totalEnergyDemand = dueConsumersFiltered.reduce((total, consumer) => total + (consumer.energy.capacity - consumer.energy.current), 0)
        acc[roomName] = {
            dueConsumers: dueConsumersFiltered,
            overdueConsumers: overdueConsumersFiltered,
            totalEnergyDemand
        }
        return acc
    },{})

    const storesByRoom = Object.entries(stores).reduce<Record<RoomName, Store[]>>((acc, [name, store]) => {
        const roomName = store.roomName
        if (!acc[roomName]) {
            acc[roomName] = []
        }
        acc[roomName].push(store)
        return acc
    }, {})

    const rankedStoresByRoom = Object.entries(storesByRoom).reduce<Record<RoomName, Store[]>>((acc, [roomName, stores]) => {
        acc[roomName] = stores.sort((a, b) => b.energy.current - a.energy.current)
        return acc
    }, {})

    const averageHaulingDistancePerRoom = calculateAverageHaulingDistanceByRoom({
        rankedConsumersByRoom,
        rankedStoresByRoom,
        roomNames: Object.keys(rankedConsumersByRoom)
    })

    const dynamicEnergyDemandByRoom = Object.entries(consumerDemandByRoom).reduce<Record<RoomName,number>>((totals, [roomName,{ totalDemand }]) => {
        totals[roomName] = totalDemand + Memory.rooms[roomName].totalSourceEnergyPerTick
        return totals
    }, {})

    const dynamicEnergySupplyByRoom = Object.entries(carriersByRoom).reduce<Record<RoomName,number>>((totals, [roomName, { totalCapacity }]) => {
        const averageHaulingDistance = averageHaulingDistancePerRoom[roomName]
        totals[roomName] = totalCapacity / averageHaulingDistance
        return totals
    }, {})

    for(const roomName in dynamicEnergyDemandByRoom) {
        const energyHaulingDemand = dynamicEnergyDemandByRoom[roomName]
        const energyHaulingSupply = dynamicEnergySupplyByRoom[roomName]
        if(energyHaulingSupply && energyHaulingDemand > energyHaulingSupply) {
            energyLogistics.hauling[roomName] = {
                demand: energyHaulingDemand,
                supply: energyHaulingSupply,
                net: energyHaulingDemand - energyHaulingSupply
            }
        }
    }

    return {
        averageHaulingDistancePerRoom,
        carriersByRoom,
        dynamicEnergyDemandByRoom,
        dynamicEnergySupplyByRoom,
        consumersByRoom: rankedConsumersByRoom,
        storesByRoom: rankedStoresByRoom,
    }
}
