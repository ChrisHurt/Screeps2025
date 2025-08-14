import { mockGame, mockMemory } from './mock'

type SetupGlobalOptions = {
}

export function setupGlobals({
  }: SetupGlobalOptions = {}) {
    // @ts-ignore
    global.Game = { ...mockGame }
    // @ts-ignore
    global.Memory = { ...mockMemory }
    // @ts-ignore
    global.FIND_MY_CREEPS = 102
    // @ts-ignore
    global.FIND_MY_SPAWNS = 112
    // @ts-ignore
    global.FIND_SOURCES = 105
    // @ts-ignore
    global.FIND_MINERALS = 116
    // @ts-ignore
    global.FIND_DROPPED_RESOURCES = 106
    // @ts-ignore
    global.FIND_TOMBSTONES = 118
    // @ts-ignore
    global.FIND_RUINS = 123
    // @ts-ignore
    global.FIND_STRUCTURES = 107
    // @ts-ignore
    global.MINERAL_REGEN_TIME = 1000
    // @ts-ignore
    global.CREEP_LIFE_TIME = 1500
    // @ts-ignore
    global.WORK = 'work'
    // @ts-ignore
    global.CARRY = 'carry'
    // @ts-ignore
    global.MOVE = 'move'
    // @ts-ignore
    global.TERRAIN_MASK_PLAIN = 0
    // @ts-ignore
    global.TERRAIN_MASK_WALL = 1
    // @ts-ignore
    global.TERRAIN_MASK_SWAMP = 2
    // @ts-ignore
    global.RESOURCE_ENERGY = 'energy'
    // @ts-ignore
    global.STRUCTURE_OBSERVER = 'observer'
    // @ts-ignore
    global.STRUCTURE_STORAGE = 'storage'
    // @ts-ignore
    global.STRUCTURE_TERMINAL = 'terminal'
    // @ts-ignore
    global.STRUCTURE_SPAWN = 'spawn'
    // @ts-ignore
    global.STRUCTURE_CONTAINER = 'container'
    // @ts-ignore
    global.STRUCTURE_EXTENSION = 'extension'

    global.Game.rooms = {}
    global.Game.creeps = {}
    // @ts-ignore
    global.Game.map.visual = { line: function() { (Game.map.visual.calls = Game.map.visual.calls || []).push([...arguments]) } }

    Memory.mapConnections = []
    Memory.mapRoomGraph = {}
  }