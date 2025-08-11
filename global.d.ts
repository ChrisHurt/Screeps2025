import {
  CreepMemory as CustomCreepMemory,
  PowerCreepMemory,
  RoomId,
  CustomRoomMemory,
  RoomHarvestTask,
  RoomUpgradeTask,
  StructureEnergyImpact,
  CreepEnergyImpact,
  CreepUpgradeTask,
  CreepHarvestTask,

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
  interface CreepMemory extends CustomCreepMemory {}
  interface Memory {
    creeps: { [name: string]: CreepMemory }
    production: {
      energy: Record<string,StructureEnergyImpact | CreepEnergyImpact>
    }
    reservations: {
      energy: Record<string, StructureEnergyImpact | CreepEnergyImpact>
      tasks: Record<string, CreepUpgradeTask | CreepHarvestTask>
    }
    mapConnections: string[]  // List of connections between rooms in the format "roomNameOne-roomNameTwo"
    mapRoomGraph: {           // Denotes connections between rooms
      [roomId: RoomId]: RoomId[]
    }
    memoryInitialised?: boolean
    powerCreeps: { [name: string]: Partial<PowerCreepMemory> }
    rooms: { [name: RoomId]: RoomMemory }
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
    effectiveEnergyPerTick: number
    totalSourceEnergyPerTick: number
  }

  interface Creep {
    workParts: number
    carryParts: number
    moveParts: number
    bodyParts: { [type: string]: number }
    memory: CreepMemory
  }
}

export {}