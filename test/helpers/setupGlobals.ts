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
    global.FIND_MY_CONSTRUCTION_SITES = 114
    // @ts-ignore
    global.HARVEST_POWER = 2
    // @ts-ignore
    global.REPAIR_POWER = 100
    // @ts-ignore
    global.FIND_HOSTILE_CREEPS = 103
    // @ts-ignore
    global.FIND_HOSTILE_POWER_CREEPS = 121
    // @ts-ignore
    global.FIND_HOSTILE_STRUCTURES = 109
    // @ts-ignore
    global.FIND_MY_CREEPS = 102
    // @ts-ignore
    global.FIND_MY_SPAWNS = 112
    // @ts-ignore
    global.FIND_MY_STRUCTURES = 108
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
    global.ATTACK = 'attack'
    // @ts-ignore
    global.CARRY = 'carry'
    // @ts-ignore
    global.MOVE = 'move'
    // @ts-ignore
    global.TOUGH = 'tough'
    // @ts-ignore
    global.WORK = 'work'
    // @ts-ignore
    global.RANGED_ATTACK = 'ranged_attack'
    // @ts-ignore
    global.HEAL = 'heal'
    // @ts-ignore
    global.CLAIM = 'claim'
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
    // @ts-ignore
    global.STRUCTURE_TOWER = 'tower'
    // @ts-ignore
    global.STRUCTURE_LAB = 'lab'
    // @ts-ignore
    global.STRUCTURE_ROAD = 'road'
    // @ts-ignore
    global.STRUCTURE_RAMPART = 'rampart'
    // @ts-ignore
    global.STRUCTURE_CONTROLLER = 'controller'
    // @ts-ignore
    global.FIND_CONSTRUCTION_SITES = 108
    // @ts-ignore
    global.OK = 0
    // @ts-ignore
    global.ERR_NOT_ENOUGH_ENERGY = -6
    // @ts-ignore
    global.ERR_INVALID_TARGET = -7
    // @ts-ignore
    global.ERR_BUSY = -4

    // @ts-ignore
    global.RoomPosition = class MockRoomPosition {
      x: number
      y: number
      roomName: string

      constructor(x: number, y: number, roomName: string) {
        this.x = x
        this.y = y
        this.roomName = roomName
      }

      findInRange(findType: any, range: number) {
        return []
      }

      inRangeTo(target: any, range: number) {
        return false
      }
    }

    global.Game.rooms = {}
    global.Game.creeps = {}
    // @ts-ignore
    global.Game.map.visual = { line: function() { (Game.map.visual.calls = Game.map.visual.calls || []).push([...arguments]) } }

    Memory.mapConnections = []
    Memory.mapRoomGraph = {}
  }