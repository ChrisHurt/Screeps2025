export interface LinkedListTask {
  next: LinkedListTask | null
  prev: LinkedListTask | null
}
export interface EvaluationTask extends LinkedListTask {}
export interface StructureTask extends LinkedListTask {}
export interface CreepTask extends LinkedListTask {}

// high: EvaluationTask[]
// medium: EvaluationTask[]
// low: EvaluationTask[]
export type TaskId = string
export type RoomId = string
type Priority = 'high' | 'medium' | 'low'

export interface LinkedListQueue {
  head: LinkedListTask | null
  tail: LinkedListTask | null
  rankedQueue: Record<Priority, Record<TaskId, LinkedListTask>>
}

export interface InTickCache {
  threatsByRoom: {
    [roomName: string]: {
      threats: string[]
      lastChecked: number
    }
  }
}

export interface CreepMemory {}
export interface FlagMemory {}
export interface PowerCreepMemory {}
export interface RoomMemory {}
export interface SpawnMemory {}