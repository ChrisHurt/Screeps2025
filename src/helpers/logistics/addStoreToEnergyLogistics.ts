import { Store, StoreTypes, Position, storeUrgencyMatrix } from "types"

interface AddStoreToEnergyLogisticsParams {
  actions: Store['actions']
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
  actions,
  energy,
  name,
  pos,
  roomName,
  structureType
}: AddStoreToEnergyLogisticsParams): void => {
  const store: Store = {
    actions,
    energy,
    pos,
    reservations: {},
    name,
    roomName,
    urgency: storeUrgencyMatrix[structureType],
    type: structureType
  }

  Memory.energyLogistics.stores[name] = store
}