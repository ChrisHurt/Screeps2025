import { Store, StoreTypes, Position, storeUrgencyMatrix, StructureName } from "types"

interface AddStoreToEnergyLogisticsParams {
  actions: Store['actions']
  energy: {
    current: number
    capacity: number
  }
  name: StructureName
  pos: Position
  roomName: string
  storeType: StoreTypes
  structureType: StructureConstant
}

export const addStoreToMemory = ({
  actions,
  energy,
  name,
  pos,
  roomName,
  storeType,
  structureType
}: AddStoreToEnergyLogisticsParams): void => {
  const store: Store = {
    actions,
    energy,
    pos,
    reservations: {},
    name,
    roomName,
    urgency: storeUrgencyMatrix[storeType],
    type: storeType
  }

  Memory.energyLogistics.stores[name] = store
  Memory.structures[name] = {
    name,
    pos,
    roomName,
    type: structureType
}
}