export enum EnergyImpactType {
  CREEP = 'creep',
  SPAWN = 'spawn',
  CONTAINERS = 'containers',
  RAMPARTS = 'ramparts',
  ROADS = 'roads',
}

export interface EnergyImpact {
  perTickAmount: number // + is Production, - is Upkeep
  roomNames: string[]
}

export interface StructureEnergyImpact extends EnergyImpact {
  roomNames: [string]
  type: Omit<EnergyImpactType, 'CREEP'>
}
export interface CreepEnergyImpact extends EnergyImpact {
  role: CreepRole
  type: EnergyImpactType.CREEP
}

export interface Position {
  x: number
  y: number
}
export interface LinkedListTask {
  next: LinkedListTask | null
  prev: LinkedListTask | null
}
export type TaskType = 'harvest' | 'upgrade' | 'build' | 'repair' | 'attack' | 'defend' | 'claim' | 'withdraw' | 'transfer' | 'drop' | 'pickup'
export interface EvaluationTask extends LinkedListTask {}
export interface StructureTask extends LinkedListTask {}
export interface CreepTask {
  taskId: string
  type: TaskType
}

export interface CreepBuildTask extends CreepTask, BuildParams {}

export interface CreepUpgradeTask extends CreepTask {
  controllerId: string
  controllerPosition: RoomPosition
  returnPath: RoomPosition[]
  type: 'upgrade'
  workParts: number
}
export interface CreepHarvestTask extends CreepTask {
  returnPath: RoomPosition[]
  sourceId: string
  sourcePosition: RoomPosition
  type: 'harvest'
  workParts: number
}
export interface RoomHarvestTask {
  availablePositions: RoomPosition[]
  sourceId: string
  sourcePosition: RoomPosition
  roomName: RoomId
  requiredWorkParts: number
  reservingCreeps: ReservingCreeps
}

export interface ReservingCreeps {
  [creepId: string]: ReservingCreep
}

export interface ReservingCreep {
  workParts: number
}

export interface RoomBuildTask {
  buildParams: BuildParams
  roomName: RoomId
  reservingCreeps: ReservingCreeps
}

export interface RoomUpgradeTask {
  availablePositions: RoomPosition[]
  controllerId: string
  controllerPosition: RoomPosition
  roomName: RoomId
  reservingCreeps: ReservingCreeps
}

export type TaskId = string
export type RoomId = string
export enum QueuePriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2
}

export type TaskQueue = Record<TaskId, LinkedListTask>

export interface LinkedListQueue {
  head: LinkedListTask | null
  tail: LinkedListTask | null
  rankedQueue: Record<QueuePriority, TaskQueue>
}

export interface InTickCache {
  threatsByRoom: {
    [roomName: string]: {
      threats: string[]
      lastChecked: number
    }
  }
}

export type SharedCreepContext = {
  idleStarted?: number
}

export enum SharedCreepEventType {
  hostilesEngaged = 'hostilesEngaged',
  hostilesNeutralised = 'hostilesNeutralised',
  idle = 'idle',
  recycleSelf = 'recycleSelf',
  full = 'full',
  empty = 'empty',
  startUpgrading = 'startUpgrading',
  upgraded = 'upgraded'
}

export enum SharedCreepState {
  attacking = 'attacking',
  building = 'building',
  collectingEnergy = 'collectingEnergy',
  collectingMineral = 'collectingMineral',
  harvesting = 'harvesting',
  depositing = 'depositing',
  error = 'error',
  idle = 'idle',
  recycling = 'recycling',
  upgrading = 'upgrading'
}

export enum CreepRole {
  HARVESTER = 'harvester',
  GUARD = 'guard',
  UPGRADER = 'upgrader',
  BUILDER = 'builder',
}

export interface CreepMemory {
  idleStarted?: number // Game Timestamp when the creep went idle
  role: CreepRole
  state?: SharedCreepState
  task?: CreepHarvestTask | CreepUpgradeTask
}

export interface FlagMemory {}
export interface PowerCreepMemory {}

export interface BuildParams {
  position: RoomPosition
  repairDuringSiege: boolean
  path: RoomPosition[]
  structureType: BuildableStructureConstant
}
export interface CustomRoomMemory {
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
  structures?: {
    containers: {
      controller?: BuildParams
      recycle?: BuildParams
      sources?: {
        [sourceId: string]: BuildParams
      }
    }
    spawn?: BuildParams[]
    towers?: BuildParams[]
  }
  tasks?: {
    build: RoomBuildTask[]
    upgrade?: RoomUpgradeTask
    harvest: RoomHarvestTask[]
  }
  threats?: {
    enemyCreepCount: number
    enemyPowerCreepCount: number
    enemyStructures: string[]
    lastObserved: number
  }
  effectiveEnergyPerTick: number
  totalSourceEnergyPerTick: number
}
export interface SpawnMemory {}

type FixedLengthArray<T, N extends number, A extends T[] = []> =
  A['length'] extends N
    ? A
    : FixedLengthArray<T, N, [...A, T]>

export type TERRAIN_MASK_PLAIN = 0
export type TERRAIN_MASK_WALL = 1
export type TERRAIN_MASK_SWAMP = 2

export const ROOM_SIZE = 50 // 50x50 grid for Screeps rooms
export const ROOM_GRID_COUNT = ROOM_SIZE*ROOM_SIZE // 50x50 grid


// @ts-ignore "Type instantiation is excessively deep and possibly infinite."
export type TerrainTypeArray = FixedLengthArray<TERRAIN_MASK_PLAIN | TERRAIN_MASK_WALL | TERRAIN_MASK_SWAMP, typeof ROOM_GRID_COUNT>

export type TerrainDistanceArray = FixedLengthArray<number, typeof ROOM_GRID_COUNT>