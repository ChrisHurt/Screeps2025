import { ConsumerCreeps, Position, CreepId, Producer, ProducerCreeps, creepUrgencyMatrix } from "types"

interface AddProducerCreepToEnergyLogisticsParams {
  energy: {
    current: number
    capacity: number
    }
    name: string
    pos: Position
    productionPerTick: number
    roomName: string
    role: ProducerCreeps
    withdrawTiming?: {
      earliestTick: number
      latestTick: number
    }
}

export const addProducerCreepToEnergyLogistics = ({
    energy,
    name,
    pos,
    productionPerTick,
    role,
    roomName,
    withdrawTiming = {
      earliestTick: Game.time,
      latestTick: Game.time,
    },
}: AddProducerCreepToEnergyLogisticsParams): void => {
  const producer: Producer = {
    energy,
    pos,
    roomName,
    urgency: creepUrgencyMatrix[role],
    withdrawTiming,
    productionPerTick,
    type: role
  }

  Memory.energyLogistics.producers[name] = producer
}