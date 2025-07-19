import {
  CreepMemory,
  FlagMemory,
  LinkedListQueue,
  PowerCreepMemory,
  RoomMemory,
  SpawnMemory,
  RoomId,
  CustomRoom
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
    rooms: { [name: RoomId]: CustomRoom }
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
    mapRoomGraph: { // Denotes connections between rooms
      [roomId: RoomId]: RoomId[]
    }
    mapConnections: string[] // List of connections between rooms in the format "roomNameOne-roomNameTwo"
    memoryInitialised?: boolean
    powerCreeps: { [name: string]: Partial<PowerCreepMemory> }
    queues: {
      evaluations: LinkedListQueue
      structures: LinkedListQueue
      creeps: LinkedListQueue
    }
    rooms: { [name: string]: Partial<RoomMemory> }
    spawns: { [name: string]: Partial<SpawnMemory> }
  }
}

export {}