import { Consumer, ConsumerStructures, consumerStructureUrgencyMatrix, Position } from "types"

interface AddConsumerStructureToEnergyLogisticsParams {
  decayTiming?: {
    interval: number
    threshold: number
    earliestTick: number
    latestTick: number
  }
  depositTiming?: {
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
  structureType: ConsumerStructures
}

export const addConsumerStructureToEnergyLogistics = ({
  decayTiming,
  depositTiming = {
    earliestTick: Game.time,
    latestTick: Game.time,
  },
  energy,
  name,
  pos,
  productionPerTick,
  roomName,
  structureType
}: AddConsumerStructureToEnergyLogisticsParams): void => {

  const consumer: Consumer = {
    decayTiming,
    depositTiming,
    energy,
    pos,
    roomName,
    urgency: consumerStructureUrgencyMatrix[structureType],
    productionPerTick,
    type: structureType
  }

  Memory.energyLogistics.consumers[name] = consumer
}