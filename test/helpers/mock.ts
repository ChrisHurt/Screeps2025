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
  spawns: {
    'Spawn1': { id: 'spawn1', spawning: false, spawnCreep: () => {} },
  } as any as StructureSpawn[],
  time: 12345,
  map: {
    describeExits: (roomName: string) => ({})
  }
}

export const mockMemory: Memory = {
  creeps: {},
  flags: {},
  rooms: {},
  mapRoomGraph: {},
  mapConnections: [],
  memoryInitialised: false,
  production: {
    energy: {}
  },
  reservations: {
    energy: {},
    tasks: {}
  },
  powerCreeps: {},
  spawns: {},
  energyLogistics: {
    carriers: {},
    consumers: {},
    linkGroups: {},
    producers: {},
    roomStates: {},
    stores: {},
    terminals: {},
  }
}

export type ExitKey = "1" | "3" | "5" | "7"
export type ExitsInformation = Partial<Record<ExitKey, string>>
