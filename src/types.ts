// NOTE: These are convenience types, to make the purpose of each ID clear in its context
export type SourceId = string     // Id of StructureSource
export type SpawnId = string      // Id of StructureSpawn
export type CreepId = string      // Id of Creep
export type StructureId = string  // Id of any structure
export type StructureName = `${StructureConstant}_${string}:${number},${number}`
export type RoomName = string     // Name of Room
export type TerminalId = string   // Id of StructureTerminal

export enum CreepRole {
  HARVESTER = 'harvester',
  HAULER = 'hauler',
  GUARD = 'guard',
  UPGRADER = 'upgrader',
  BUILDER = 'builder',
}

// ------ Energy State Types ------
export type DECAYABLE_STRUCTURE =
| STRUCTURE_CONTAINER | STRUCTURE_ROAD | STRUCTURE_RAMPART

export type PERSISTENT_STRUCTURE =
| STRUCTURE_SPAWN | STRUCTURE_EXTENSION
| STRUCTURE_TOWER | STRUCTURE_LAB

export type ProducerCreeps = CreepRole.HARVESTER
export type ProducerStructures = STRUCTURE_SPAWN

export type CarrierCreeps = CreepRole.HAULER

export type ConsumerCreeps =
| CreepRole.BUILDER
| CreepRole.UPGRADER
export type ConsumerStructures =
| PERSISTENT_STRUCTURE
| DECAYABLE_STRUCTURE

export const consumerCreepRoles = [
  CreepRole.BUILDER,
  CreepRole.UPGRADER
]
export const consumerStructureTypes: ConsumerStructures[] = [
  STRUCTURE_SPAWN,
  STRUCTURE_EXTENSION,
  STRUCTURE_TOWER,
  STRUCTURE_LAB,
  STRUCTURE_CONTAINER,
  STRUCTURE_ROAD,
  STRUCTURE_RAMPART
]
export const producerCreepRoles = [
  CreepRole.HARVESTER
]
export const producerStructureTypes: ProducerStructures[] = [
  STRUCTURE_SPAWN
]

export type ConsumerTypes = ConsumerStructures | ConsumerCreeps
export type ProducerTypes = ProducerStructures | ProducerCreeps
export const SourceContainer = `${STRUCTURE_CONTAINER}-source`
export const ControllerContainer = `${STRUCTURE_CONTAINER}-${STRUCTURE_CONTROLLER}`
export type ContainerTypes = `${STRUCTURE_CONTAINER}-source` | `${STRUCTURE_CONTAINER}-${STRUCTURE_CONTROLLER}`

export type StoreTypes =
| ContainerTypes | STRUCTURE_SPAWN
| STRUCTURE_STORAGE | STRUCTURE_TERMINAL

export enum Urgency {
  CRITICAL = 3,
  HIGH = 2,
  MEDIUM = 1,
  LOW = 0,
  NONE = -1
}

// NOTE: Further refinements will be needed after testing
export const creepUrgencyMatrix: Record<CreepRole, { peace: Urgency, war: Urgency }> = {
  [CreepRole.HARVESTER]: { peace: Urgency.MEDIUM, war: Urgency.MEDIUM },
  [CreepRole.BUILDER]: { peace: Urgency.MEDIUM, war: Urgency.MEDIUM },
  [CreepRole.UPGRADER]: { peace: Urgency.MEDIUM, war: Urgency.MEDIUM },
  [CreepRole.GUARD]: { peace: Urgency.HIGH, war: Urgency.CRITICAL },
  [CreepRole.HAULER]: { peace: Urgency.HIGH, war: Urgency.HIGH },
}

export const consumerStructureUrgencyMatrix: Record<ConsumerStructures, { peace: Urgency, war: Urgency }> = {
  // High priority structures for basic operation
  [STRUCTURE_SPAWN]: { peace: Urgency.HIGH, war: Urgency.HIGH },
  [STRUCTURE_EXTENSION]: { peace: Urgency.HIGH, war: Urgency.HIGH },

  // Medium priority defensive and utility structures
  [STRUCTURE_TOWER]: { peace: Urgency.MEDIUM, war: Urgency.CRITICAL },
  [STRUCTURE_LAB]: { peace: Urgency.MEDIUM, war: Urgency.LOW },

  // Low priority infrastructure and decay structures
  [STRUCTURE_CONTAINER]: { peace: Urgency.LOW, war: Urgency.LOW },
  [STRUCTURE_ROAD]: { peace: Urgency.LOW, war: Urgency.LOW },
  [STRUCTURE_RAMPART]: { peace: Urgency.LOW, war: Urgency.HIGH }
}

export const producerStructureUrgencyMatrix: Record<ProducerStructures, { peace: Urgency, war: Urgency }> = {
  [STRUCTURE_SPAWN]: { peace: Urgency.HIGH, war: Urgency.HIGH }
}

// Lower values should be prioritized for pickup. Higher values should be prioritised for deposit.
export const storeUrgencyMatrix: Record<StoreTypes, { peace: Urgency, war: Urgency }> = {
  ['container-source']: { peace: Urgency.LOW, war: Urgency.LOW },
  ['container-controller']: { peace: Urgency.HIGH, war: Urgency.CRITICAL },
  [STRUCTURE_STORAGE]: { peace: Urgency.MEDIUM, war: Urgency.LOW },
  [STRUCTURE_TERMINAL]: { peace: Urgency.MEDIUM, war: Urgency.LOW },
  [STRUCTURE_SPAWN]: { peace: Urgency.CRITICAL, war: Urgency.CRITICAL }
}

export interface BaseLogisticsContext {
  energy: {
    current: number
    capacity: number
  }
  pos: Position
  roomName: string
  urgency: {
    peace: Urgency
    war: Urgency
  }
}

export interface DecayTiming {
  earliestTick: number  // Game tick when decay is anticipated to start.
                        // If not at intended health, this will remain in the past until resolved
  interval: number
  latestTick: number    // Game tick when decay is anticipated to drop hits below `threshold`
  threshold: number
}

export interface Consumer extends BaseLogisticsContext {
  decayTiming?: DecayTiming
  depositTiming: {
    earliestTick: number  // Game tick when minimum of 50 free energy capacity is anticipated
    latestTick: number    // Game tick when store is anticipated to be completely empty
  }
  productionPerTick: number
  type: ConsumerTypes
}

export interface Producer extends BaseLogisticsContext {
  withdrawTiming: {
    earliestTick: number  // Game tick when minimum of 50 used energy capacity is anticipated
    latestTick: number    // Game tick when store (of creep or structure) is anticipated to be completely full
  }
  productionPerTick: number
  type: ProducerTypes
}

export interface Store extends BaseLogisticsContext {
  actions: {
    collect: 'withdraw' | 'pickup'
    deliver: 'transfer' | 'drop'
  }
  reservations: Record<CreepId, number>
  name: string
  type: StoreTypes
}

export interface Link extends BaseLogisticsContext {
  transferTiming: {
    earliestTick: number  // Game tick when link will be ready for transfer
  }
}

export interface Terminal extends BaseLogisticsContext {
  sendTiming: {
    earliestTick: number  // Game tick when terminal will be ready for send
  }
}

export interface Carrier extends BaseLogisticsContext {
  decayTiming: DecayTiming
  name: string
  reservation?: {
    action: 'withdraw' | 'pickup' | 'transfer' | 'drop'
    amount: number
    arrivalTick: number
    path: RoomPosition[]
    targetId: CreepId | StructureId
    type: 'collectEnergy' | 'deliverEnergy'
  }
  type: CarrierCreeps
}

export interface RoomState {
  isUnderAttack: boolean,
  energyEmergency: boolean,
  netEnergyProduction: number,
  rcl: number
}

export interface HaulingSupplyAndDemand {
  demand: number
  supply: number
  net: number
}

export interface EnergyLogistics {
  carriers: Record<CreepId, Carrier>
  consumers: Record<CreepId | StructureId, Consumer>
  hauling: Record<RoomName, HaulingSupplyAndDemand>
  linkGroups: Record<RoomName, Link[]>
  producers: Record<CreepId | SpawnId, Producer>
  roomStates: Record<RoomName, RoomState>
  stores: Record<CreepId | StructureName, Store>
  terminals: Record<TerminalId, Terminal>
}

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
export type TaskType =
  | 'harvest' | 'upgrade' | 'build'
  | 'repair' | 'attack' | 'defend'
  | 'claim' | 'withdraw' | 'transfer'
  | 'drop' | 'pickup' | 'idle'
  | 'collectEnergy' | 'deliverEnergy'

export interface CreepTask {
  taskId: SourceId | CreepId | StructureId
  type: TaskType
}

export interface IdleTask extends CreepTask {}

export interface CreepBuildTask extends CreepTask, Omit<BuildParams, 'structureType'> {
  type: 'build'
}

export interface DeliverEnergyTask extends CreepTask {
  amount: number
  action: 'transfer' | 'drop'
  position: RoomPosition
  type: 'deliverEnergy'
}

export interface CollectEnergyTask extends CreepTask {
  amount: number
  action: 'withdraw' | 'pickup'
  position: RoomPosition
  type: 'collectEnergy'
}

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
  roomName: RoomName
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
  roomName: RoomName
  reservingCreeps: ReservingCreeps
}

export interface RoomUpgradeTask {
  availablePositions: RoomPosition[]
  controllerId: string
  controllerPosition: RoomPosition
  roomName: RoomName
  reservingCreeps: ReservingCreeps
}

// ------ Share Creep State Machine & Execution Types ------
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
  depositingEnergy = 'depositingEnergy',
  error = 'error',
  idle = 'idle',
  recycling = 'recycling',
  upgrading = 'upgrading'
}

export interface StructureMemory {
  name: StructureName
  pos: Position
  roomName: RoomName
  type: StructureConstant
  energyImpact?: StructureEnergyImpact
}

export interface CreepMemory {
  idleStarted?: number // Game Timestamp when the creep went idle
  role: CreepRole
  state?: SharedCreepState
  task?: CreepHarvestTask | CreepUpgradeTask | CreepBuildTask
  energyImpact?: CreepEnergyImpact
}

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