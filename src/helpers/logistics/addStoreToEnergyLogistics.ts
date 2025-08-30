import { Store, StoreTypes, Position, storeUrgencyMatrix } from "types"

interface AddStoreToEnergyLogisticsParams {
  energy: {
    current: number
    capacity: number
  }
  name: string
  pos: Position
  roomName: string
  structureType: StoreTypes
}

export const addStoreToEnergyLogistics = ({
  energy,
  name,
  pos,
  roomName,
  structureType
}: AddStoreToEnergyLogisticsParams): void => {
  const store: Store = {
    energy,
    pos,
    roomName,
    urgency: storeUrgencyMatrix[structureType],
    type: structureType
  }

  Memory.energyLogistics.stores[name] = store
}