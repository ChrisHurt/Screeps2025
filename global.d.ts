import {
  CreepMemory as CustomCreepMemory,
  FlagMemory,
  LinkedListQueue,
  PowerCreepMemory,
  SpawnMemory,
  RoomId,
  CustomRoomMemory,
  RoomHarvestTask,
  RoomUpgradeTask,
  Position,
  TaskType,
  CreepTask,
  CreepHarvestTask,
  CreepUpgradeTask
} from "types"

declare global {
  interface Game {
    cpu: CPU
    creeps: { [name: string]: Creep }
    flags: { [name: string]: Flag }
    gcl: GlobalControlLevel
    gpl: GlobalPowerLevel
    map: GameMap
    market: Market
    powerCreeps: { [name: string]: PowerCreep }
    resources: { [key: string]: any }
    rooms: { [name: string]: Room }
    spawns: { [name: string]: StructureSpawn }
    structures: { [name: string]: Structure }
    constructionSites: { [name: string]: ConstructionSite }
    shard: Shard
    time: number
  }
  interface Memory {
    creeps: { [name: string]: Partial<CreepMemory> }
    initialCalculationsDone?: boolean
    flags: { [name: string]: Partial<FlagMemory> }
    mapConnections: string[]  // List of connections between rooms in the format "roomNameOne-roomNameTwo"
    mapRoomGraph: {           // Denotes connections between rooms
      [roomId: RoomId]: RoomId[]
    }
    memoryInitialised?: boolean
    powerCreeps: { [name: string]: Partial<PowerCreepMemory> }
    queues: {
      evaluations: LinkedListQueue
      structures: LinkedListQueue
      creeps: LinkedListQueue
    }
    rooms: { [name: RoomId]: RoomMemory }
    spawns: { [name: string]: Partial<SpawnMemory> }
  }
  interface RoomMemory extends CustomRoomMemory {
    mineral?: {
      type: MineralConstant
      density: number
      position: { x: number; y: number }
      mineralGenerationPerTick: number
    }
    optimumSpawnPosition?: {
      x: number
      y: number
    }
    sources?: {
      [sourceId: string]: {
        energyGenerationPerTick: number
        position: { x: number; y: number }
      }
    }
    tasks?: {
      upgrade?: RoomUpgradeTask
      harvest: RoomHarvestTask[]
    }
    totalEnergyGenerationPerTick: number
  }
  interface CreepMemory extends CustomCreepMemory {}

  interface Creep {
    workParts: number
    carryParts: number
    moveParts: number
    bodyParts: { [type: string]: number }
    memory: CreepMemory
  }
}

export {}