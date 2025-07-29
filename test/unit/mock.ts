/// <reference path="../../global.d.ts" />

// NOTE:
// The global types reference is crucial for TypeScript to recognize our custom
// global Memory interface. Without it, TypeScript will default to @types/screeps' Memory
// interface, which does not include our custom properties like mapRoomGraph, mapConnections, etc.

export const mockGame: {
  creeps: { [name: string]: any }
  rooms: { [name: string]: any }
  spawns: any
  time: any
  map: {
    describeExits: (roomName: string) => { [exitKey: string]: string | undefined }
  }
} = {
  creeps: {},
  rooms: {},
  spawns: {},
  time: 12345,
  map: {
    describeExits: (roomName: string) => ({})
  }
}

export const mockMemory: Memory = {
  creeps: {},
  flags: {},
  rooms: {},
  initialCalculationsDone: false,
  mapRoomGraph: {},
  mapConnections: [],
  memoryInitialised: false,
  powerCreeps: {},
  queues: {
    evaluations: { head: null, tail: null, rankedQueue: [{},{},{}] },
    structures: { head: null, tail: null, rankedQueue: [{},{},{}] },
    creeps: { head: null, tail: null, rankedQueue: [{},{},{}] }
  },
  spawns: {}
}

export type ExitKey = "1" | "3" | "5" | "7"
export type ExitsInformation = Partial<Record<ExitKey, string>>
