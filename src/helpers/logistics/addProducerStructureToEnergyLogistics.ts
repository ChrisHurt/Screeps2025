import { StructureId, Producer, ProducerStructures, producerStructureUrgencyMatrix, Position } from "types"

interface AddProducerStructureToEnergyLogisticsParams {
  decayTiming?: {
    interval: number
    threshold: number
    earliestTick: number
    latestTick: number
  }
  energy: {
    current: number
    capacity: number
  }
  name: string
  pos: Position
  productionPerTick: number // NOTE: Decay-inclusive
  roomName: string
  structureType: ProducerStructures
  withdrawTiming?: {
    earliestTick: number
    latestTick: number
  }
}

export const addProducerStructureToEnergyLogistics = ({
  decayTiming,
  energy,
  name,
  pos,
  productionPerTick,
  roomName,
  structureType,
  withdrawTiming = {
    earliestTick: Game.time,
    latestTick: Game.time,
  },
}: AddProducerStructureToEnergyLogisticsParams): void => {
  const producer: Producer = {
    energy,
    pos,
    roomName,
    urgency: producerStructureUrgencyMatrix[structureType],
    productionPerTick,
    type: structureType,
    withdrawTiming,
  }

  Memory.energyLogistics.producers[name] = producer
}