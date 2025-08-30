import { Consumer, ConsumerCreeps, creepUrgencyMatrix, Position } from "types"

interface AddConsumerCreepToEnergyLogisticsParams {
  decayTiming?: {
    earliestTick: number
    interval: number
    latestTick: number
    threshold: number
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
  productionPerTick: number
  roomName: string
  role: ConsumerCreeps
}

export const addConsumerCreepToEnergyLogistics = ({
  energy,
  decayTiming = {
    earliestTick: Game.time,
    interval: 1,
    latestTick: Game.time + CREEP_LIFE_TIME,
    threshold: 50
  },
  depositTiming = {
    earliestTick: Game.time,
    latestTick: Game.time,
  },
  name,
  pos,
  productionPerTick,
  role,
  roomName,
}: AddConsumerCreepToEnergyLogisticsParams): void => {
  const consumer: Consumer = {
    energy,
    pos,
    roomName,
    urgency: creepUrgencyMatrix[role],
    decayTiming,
    depositTiming,
    productionPerTick,
    type: role
  }

  Memory.energyLogistics.consumers[name] = consumer
}