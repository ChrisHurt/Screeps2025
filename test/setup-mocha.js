//inject mocha globally to allow custom interface refer without direct import - bypass bundle issue
global._ = require('lodash');
global.mocha = require('mocha');
global.chai = require('chai');
global.sinon = require('sinon');
global.chai.use(require('sinon-chai'));

// Override ts-node compiler options
process.env.TS_NODE_PROJECT = 'tsconfig.test.json'

// Set up Screeps globals before any test files are loaded
// This is necessary because some imports use Screeps constants at module level
global.FIND_HOSTILE_CREEPS = 103
global.FIND_HOSTILE_POWER_CREEPS = 121
global.FIND_HOSTILE_STRUCTURES = 109
global.FIND_MY_CREEPS = 102
global.FIND_MY_SPAWNS = 112
global.FIND_SOURCES = 105
global.FIND_MINERALS = 116
global.FIND_DROPPED_RESOURCES = 106
global.FIND_TOMBSTONES = 118
global.FIND_RUINS = 123
global.FIND_STRUCTURES = 107
global.FIND_CONSTRUCTION_SITES = 108
global.MINERAL_REGEN_TIME = 1000
global.CREEP_LIFE_TIME = 1500
global.ATTACK = 'attack'
global.CARRY = 'carry'
global.MOVE = 'move'
global.TOUGH = 'tough'
global.WORK = 'work'
global.RANGED_ATTACK = 'ranged_attack'
global.HEAL = 'heal'
global.CLAIM = 'claim'
global.TERRAIN_MASK_PLAIN = 0
global.TERRAIN_MASK_WALL = 1
global.TERRAIN_MASK_SWAMP = 2
global.RESOURCE_ENERGY = 'energy'
global.STRUCTURE_OBSERVER = 'observer'
global.STRUCTURE_STORAGE = 'storage'
global.STRUCTURE_TERMINAL = 'terminal'
global.STRUCTURE_SPAWN = 'spawn'
global.STRUCTURE_CONTAINER = 'container'
global.STRUCTURE_CONTROLLER = 'controller'
global.STRUCTURE_EXTENSION = 'extension'
global.STRUCTURE_TOWER = 'tower'
global.STRUCTURE_LAB = 'lab'
global.STRUCTURE_ROAD = 'road'
global.STRUCTURE_RAMPART = 'rampart'

// Mock Game object
global.Game = {
  time: 12345,
  rooms: {},
  creeps: {},
  spawns: {},
  cpu: { limit: 20, tickLimit: 500, bucket: 10000, getUsed: () => 0 },
  map: {
    visual: {
      line: function() { 
        (this.calls = this.calls || []).push([...arguments]) 
      },
      calls: []
    }
  }
}

// Mock Memory object
global.Memory = {
  creeps: {},
  production: { energy: {} },
  reservations: { energy: {}, tasks: {} },
  mapConnections: [],
  mapRoomGraph: {},
  memoryInitialised: true,
  powerCreeps: {},
  rooms: {},
  energyLogistics: {
    consumers: {},
    producers: {},
    stores: {},
    terminals: {},
    linkGroups: {},
    carriers: {},
    roomStates: {}
  }
}

// Mock RoomPosition
global.RoomPosition = class MockRoomPosition {
  constructor(x, y, roomName) {
    this.x = x
    this.y = y
    this.roomName = roomName
  }

  findInRange(findType, range) {
    return []
  }

  inRangeTo(target, range) {
    return false
  }

  getRangeTo(target) {
    return 1
  }

  isNearTo(target) {
    return true
  }

  findClosestByPath(objects) {
    return objects[0] || null
  }
}
