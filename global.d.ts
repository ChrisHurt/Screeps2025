import {
  CreepMemory as CustomCreepMemory,
  CustomRoomMemory,
  StructureEnergyImpact,
  CreepEnergyImpact,
  CreepUpgradeTask,
  CreepHarvestTask,
  CreepBuildTask,
  RoomName,
  EnergyLogistics,
  StructureMemory,
  StructureName,
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
    energyLogistics: EnergyLogistics
    mapConnections: string[]  // List of connections between rooms in the format "roomNameOne-roomNameTwo"
    mapRoomGraph: {           // Denotes connections between rooms
      [roomId: RoomName]: RoomName[]
    }
    memoryInitialised?: boolean
    production: {
      energy: Record<string,StructureEnergyImpact | CreepEnergyImpact>
    }
    reservations: {
      energy: Record<string, StructureEnergyImpact | CreepEnergyImpact>
      tasks: Record<string, CreepBuildTask | CreepUpgradeTask | CreepHarvestTask>
    }
    rooms: Record<RoomName,RoomMemory>
    structures: Record<StructureName,StructureMemory>

  }
  interface RoomMemory extends CustomRoomMemory {}

  interface Creep {
    workParts: number
    carryParts: number
    moveParts: number
    bodyParts: { [type: string]: number }
    memory: CreepMemory
  }
}

export {}