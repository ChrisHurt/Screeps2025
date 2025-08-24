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
    energyLogistics: EnergyLogistics
    production: {
      energy: Record<string,StructureEnergyImpact | CreepEnergyImpact>
    }
    reservations: {
      energy: Record<string, StructureEnergyImpact | CreepEnergyImpact>
      tasks: Record<string, CreepBuildTask | CreepUpgradeTask | CreepHarvestTask>
    }
    mapConnections: string[]  // List of connections between rooms in the format "roomNameOne-roomNameTwo"
    mapRoomGraph: {           // Denotes connections between rooms
      [roomId: RoomName]: RoomName[]
    }
    memoryInitialised?: boolean
    powerCreeps: { [name: string]: Partial<PowerCreepMemory> }
    rooms: { [name: RoomName]: RoomMemory }
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