import { consumerStructureTypes, ConsumerStructures, CreepId, RoomName, StructureId, consumerCreepRoles, ProducerStructures, producerStructureTypes, producerCreepRoles, CreepRole, creepUrgencyMatrix, ConsumerTypes } from "types"

export const updateEnergyLogistics = (): void => {
    const energyLogistics = Memory.energyLogistics
    const roomSequence: RoomName[] = Object.keys(Game.rooms)

    // Clean up consumers and producers for rooms that no longer exist
    Object.entries(energyLogistics.consumers).forEach(([consumerId, consumer]) => {
        if (!roomSequence.includes(consumer.roomName)) {
            delete energyLogistics.consumers[consumerId]
        }
    })

    Object.entries(energyLogistics.producers).forEach(([producerId, producer]) => {
        if (!roomSequence.includes(producer.roomName)) {
            delete energyLogistics.producers[producerId]
        }
    })

    const Gametime = Game.time
    const CALCULATION_THRESHOLD = 50
    const roomIndexToUpdate = Gametime % CALCULATION_THRESHOLD

    const roomName = roomSequence[roomIndexToUpdate]

    if (!roomName) return

    const { consumerStructures, producerStructures } = Game.rooms[roomName].find<AnyStoreStructure>(FIND_MY_STRUCTURES)
        .reduce<{
            consumerStructures: Record<StructureId, AnyStoreStructure>,
            producerStructures: Record<StructureId, AnyStoreStructure>
        }>((acc, structure) => {
            if (consumerStructureTypes.includes(structure.structureType as ConsumerStructures)) {
                acc.consumerStructures[structure.id] = structure
            }
            if (producerStructureTypes.includes(structure.structureType as ProducerStructures)) {
                acc.producerStructures[structure.id] = structure
            }
            return acc
        },
        { consumerStructures: {}, producerStructures: {}}
    )
    const { consumerCreeps, producerCreeps } = Game.rooms[roomName].find(FIND_MY_CREEPS)
        .reduce<{
            consumerCreeps: Record<CreepId, Creep>,
            producerCreeps: Record<CreepId, Creep>
        }>((acc, creep) => {
            if (consumerCreepRoles.includes(creep.memory.role)) {
                acc.consumerCreeps[creep.id] = creep
            }
            if (producerCreepRoles.includes(creep.memory.role)) {
                acc.producerCreeps[creep.id] = creep
            }
            return acc
        }, { consumerCreeps: {}, producerCreeps: {} }
    )

    // NOTE: New Consumers & Producers are added to energyLogistics on spawn / construction site instantiation

    // Update existing consumers & producers for energy logistics
    Object.entries(energyLogistics.consumers).forEach(([consumerId, consumer]) => {
        const roomName = consumer.roomName

        const shouldUpdateConsumers = roomIndexToUpdate === roomSequence.indexOf(roomName)

        if(!shouldUpdateConsumers) return

        const consumerEntity = consumerStructures[consumerId] || consumerCreeps[consumerId]
        const consumerEnergy = consumerEntity?.store.getUsedCapacity(RESOURCE_ENERGY) || 0
        energyLogistics.consumers[consumerId].energy.current = consumerEnergy
    })

    Object.entries(energyLogistics.producers).forEach(([producerId, producer]) => {
        const roomName = producer.roomName

        const shouldUpdateProducers = roomIndexToUpdate === roomSequence.indexOf(roomName)
        if(!shouldUpdateProducers) return

        const producerEntity = producerStructures[producerId] || producerCreeps[producerId]
        const producerEnergy = producerEntity?.store.getUsedCapacity(RESOURCE_ENERGY) || 0
        energyLogistics.producers[producerId].energy.current = producerEnergy
    })
}