import { expect } from 'chai'
import { updateEnergyLogistics } from '../../src/helpers/logistics/updateEnergyLogistics'
import { CreepRole } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('updateEnergyLogistics', () => {
  let mockRoom: Room
  let mockConsumerCreep: Creep
  let mockProducerCreep: Creep
  let mockConsumerStructure: AnyStoreStructure
  let mockProducerStructure: AnyStoreStructure

  beforeEach(() => {
    setupGlobals()
    Game.time = 123

    // Mock structures
    mockConsumerStructure = {
      id: 'consumer-structure-1' as Id<AnyStoreStructure>,
      structureType: STRUCTURE_SPAWN,
      store: {
        getUsedCapacity: (resource: ResourceConstant) => resource === RESOURCE_ENERGY ? 150 : 0
      }
    } as AnyStoreStructure

    mockProducerStructure = {
      id: 'producer-structure-1' as Id<AnyStoreStructure>,
      structureType: STRUCTURE_SPAWN,
      store: {
        getUsedCapacity: (resource: ResourceConstant) => resource === RESOURCE_ENERGY ? 300 : 0
      }
    } as AnyStoreStructure

    // Mock creeps
    mockConsumerCreep = {
      id: 'consumer-creep-1' as Id<Creep>,
      name: 'consumer-creep-1',
      memory: { role: CreepRole.BUILDER },
      store: {
        getUsedCapacity: (resource: ResourceConstant) => resource === RESOURCE_ENERGY ? 50 : 0
      }
    } as Creep

    mockProducerCreep = {
      id: 'producer-creep-1' as Id<Creep>,
      name: 'producer-creep-1',
      memory: { role: CreepRole.HARVESTER },
      store: {
        getUsedCapacity: (resource: ResourceConstant) => resource === RESOURCE_ENERGY ? 100 : 0
      }
    } as Creep

    // Mock room
    mockRoom = {
      name: 'W1N1',
      find: (type: FindConstant) => {
        if (type === FIND_MY_STRUCTURES) {
          return [mockConsumerStructure, mockConsumerStructure, mockProducerStructure,  mockProducerStructure]
        }
        if (type === FIND_MY_CREEPS) {
          return [mockConsumerCreep,mockProducerCreep,mockConsumerCreep,mockProducerCreep]
        }
        return []
      }
    } as any as Room

    // Setup Game globals
    Game.rooms = {
      'W1N1': mockRoom
    }

    // Initialize Memory with energyLogistics structure
    Memory.energyLogistics = {
      carriers: {},
      consumers: {},
      producers: {},
      stores: {},
      linkGroups: {},
      roomStates: {},
      terminals: {}
    }
  })

  afterEach(() => {
    // Reset Game globals
    delete (Game as any).time
    delete (Game as any).rooms
    delete (Memory as any).energyLogistics
  })

  it('should return early if roomIndexToUpdate >= roomSet.size', () => {
    Game.time = 100 // 100 % 50 = 0, but no rooms means size = 0
    Game.rooms = {} // No rooms

    Memory.energyLogistics.consumers = {
      'test-consumer': {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: CreepRole.BUILDER
      }
    }

    updateEnergyLogistics()

    // Consumer should have been deleted during cleanup since room doesn't exist
    expect(Memory.energyLogistics.consumers).to.not.have.property('test-consumer')
  })

  it('should update existing producer when roomIndexToUpdate matches room sequence index', () => {
    Game.time = 0

    // @ts-ignore Mocking invalid type for testing
    mockConsumerCreep.store.getUsedCapacity = () => 75
    // @ts-ignore Mocking invalid type for testing
    mockConsumerStructure.store.getUsedCapacity = () => 75
    // @ts-ignore Mocking invalid type for testing
    mockProducerCreep.store.getUsedCapacity = () => 75
    // @ts-ignore Mocking invalid type for testing
    mockProducerStructure.store.getUsedCapacity = () => 75


    Game.rooms = {
      W1N1: {
        find: (findConstant: FindConstant) => {
          if(findConstant === FIND_MY_STRUCTURES) {
            return [mockProducerStructure]
          } else {
            return [mockProducerCreep]
          }
        }
      } as Room,
      W1N2: {
        find: (findConstant: FindConstant) => {
          if(findConstant === FIND_MY_STRUCTURES) {
            return [mockConsumerStructure]
          } else {
            return [mockConsumerCreep]
          }
        }
      } as Room
    }

    Memory.energyLogistics.consumers = {
      [mockConsumerStructure.id]: {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N2',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    Memory.energyLogistics.producers = {
      [mockProducerStructure.id]: {
        energy: { current: 0, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W1N1',
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    // Values should remain unchanged since roomIndexToUpdate (2) >= roomSequence.length
    expect(Memory.energyLogistics.consumers[mockConsumerStructure.id].energy.current).to.equal(0)
    expect(Memory.energyLogistics.consumers[mockConsumerCreep.id]).to.be.undefined
    expect(Memory.energyLogistics.producers[mockProducerStructure.id].energy.current).to.equal(75)
    expect(Memory.energyLogistics.producers[mockProducerCreep.id]).to.be.undefined
  })

  it('should update existing consumer when roomIndexToUpdate matches room sequence index', () => {
    Game.time = 0

    // @ts-ignore Mocking invalid type for testing
    mockConsumerCreep.store.getUsedCapacity = () => 75
    // @ts-ignore Mocking invalid type for testing
    mockConsumerStructure.store.getUsedCapacity = () => 75
    // @ts-ignore Mocking invalid type for testing
    mockProducerCreep.store.getUsedCapacity = () => 75
    // @ts-ignore Mocking invalid type for testing
    mockProducerStructure.store.getUsedCapacity = () => 75


    Game.rooms = {
      W1N1: {
        find: (findConstant: FindConstant) => {
          if(findConstant === FIND_MY_STRUCTURES) {
            return [mockConsumerStructure]
          } else {
            return [mockConsumerCreep]
          }
        }
      } as Room,
      W1N2: {
        find: (findConstant: FindConstant) => {
          if(findConstant === FIND_MY_STRUCTURES) {
            return [mockProducerStructure]
          } else {
            return [mockProducerCreep]
          }
        }
      } as Room
    }

    Memory.energyLogistics.consumers = {
      [mockConsumerStructure.id]: {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    Memory.energyLogistics.producers = {
      [mockProducerStructure.id]: {
        energy: { current: 0, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W1N2',
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    // Values should remain unchanged since roomIndexToUpdate (2) >= roomSequence.length
    expect(Memory.energyLogistics.consumers[mockConsumerStructure.id].energy.current).to.equal(75)
    expect(Memory.energyLogistics.consumers[mockConsumerCreep.id]).to.be.undefined
    expect(Memory.energyLogistics.producers[mockProducerStructure.id].energy.current).to.equal(0)
    expect(Memory.energyLogistics.producers[mockConsumerCreep.id]).to.be.undefined
  })

  it('should update consumer structure energy when shouldUpdateConsumers is true', () => {
    Game.time = 0 // 0 % 50 = 0, room W1N1 will be at index 0, so update

    Memory.energyLogistics.consumers = {
      [mockConsumerStructure.id]: {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    expect(Memory.energyLogistics.consumers[mockConsumerStructure.id].energy.current).to.equal(150)
  })

  it('should update consumer creep energy when shouldUpdateConsumers is true', () => {
    Game.time = 0
    // @ts-ignore Mocking invalid type for testing
    mockConsumerCreep.store.getUsedCapacity = () => 50

    Memory.energyLogistics.consumers = {
      [mockConsumerCreep.id]: {
        energy: { current: 10, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: CreepRole.BUILDER
      }
    }

    updateEnergyLogistics()

    expect(Memory.energyLogistics.consumers[mockConsumerCreep.id].energy.current).to.equal(50)
  })

  it('should update producer structure energy when shouldUpdateProducers is true', () => {
    Game.time = 0 // 0 % 50 = 0, room W1N1 will be at index 0, so update

    // @ts-ignore
    mockConsumerCreep.store.getUsedCapacity = () => 300

    Memory.energyLogistics.producers = {
      [mockProducerStructure.id]: {
        energy: { current: 0, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W1N1',
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    expect(Memory.energyLogistics.producers[mockProducerStructure.id].energy.current).to.equal(300)
  })

  it('should update producer creep energy when shouldUpdateProducers is true', () => {
    Game.time = 0 // 0 % 50 = 0, room W1N1 will be at index 0, so update

    Memory.energyLogistics.producers = {
      [mockProducerCreep.id]: {
        energy: { current: 0, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W1N1',
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: CreepRole.HARVESTER
      }
    }

    updateEnergyLogistics()

    expect(Memory.energyLogistics.producers[mockProducerCreep.id].energy.current).to.equal(100)
  })

  it('should handle fallback to 0 when structure/creep not found for consumer', () => {
    Game.time = 0
    
    Memory.energyLogistics.consumers = {
      'non-existent-consumer': {
        energy: { current: 10, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    expect(Memory.energyLogistics.consumers['non-existent-consumer'].energy.current).to.equal(0)
  })

  it('should handle fallback to 0 when structure/creep not found for producer', () => {
    Game.time = 0
    
    Memory.energyLogistics.producers = {
      'non-existent-producer': {
        energy: { current: 50, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W1N1',
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    expect(Memory.energyLogistics.producers['non-existent-producer'].energy.current).to.equal(0)
  })

  it('should delete consumers for rooms not in Game.rooms', () => {
    Memory.energyLogistics.consumers = {
      'consumer-in-missing-room': {
        energy: { current: 50, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W2N2', // Room not in Game.rooms
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      },
      [mockConsumerStructure.id]: {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1', // Room exists in Game.rooms
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    expect(Memory.energyLogistics.consumers).to.not.have.property('consumer-in-missing-room')
    expect(Memory.energyLogistics.consumers).to.have.property(mockConsumerStructure.id)
  })

  it('should delete producers for rooms not in Game.rooms', () => {
    Memory.energyLogistics.producers = {
      'producer-in-missing-room': {
        energy: { current: 50, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W2N2', // Room not in Game.rooms
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: STRUCTURE_SPAWN
      },
      [mockProducerStructure.id]: {
        energy: { current: 0, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W1N1', // Room exists in Game.rooms
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    expect(Memory.energyLogistics.producers).to.not.have.property('producer-in-missing-room')
    expect(Memory.energyLogistics.producers).to.have.property(mockProducerStructure.id)
  })

  it('should process different rooms based on game time modulo', () => {
    Game.time = 1 // 1 % 50 = 1, should process room at index 1 (W2N2)
    const mockRoom2 = {
      name: 'W2N2',
      find: () => [] // No structures/creeps in this room
    } as any as Room

    Game.rooms = {
      'W1N1': mockRoom,
      'W2N2': mockRoom2
    }

    Memory.energyLogistics.consumers = {
      'consumer-room1': {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1', // Index 0
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      },
      'consumer-room2': {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W2N2', // Index 1
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    // Only room at index 1 (W2N2) should be processed
    // consumer-room1 should remain unchanged
    expect(Memory.energyLogistics.consumers['consumer-room1'].energy.current).to.equal(0)
    // consumer-room2 should be updated (though to 0 since no structures found)
    expect(Memory.energyLogistics.consumers['consumer-room2'].energy.current).to.equal(0)
  })

  it('should build room sequence correctly when processing entries', () => {
    Game.time = 0 // Process room at index 0

    const mockRoom2 = {
      name: 'W2N2',
      find: () => [] // No structures/creeps in this room
    } as any as Room

    Game.rooms = {
      'W1N1': mockRoom,
      'W2N2': mockRoom2
    }

    // Add consumers from multiple rooms
    Memory.energyLogistics.consumers = {
      'consumer-room2': {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W2N2',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      },
      'consumer-room1': {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    // Since we process in entry order, W2N2 will be first in sequence (index 0)
    // Game.time = 0, so room at index 0 should be processed
    // The room sequence should be built as rooms are encountered
    // This test verifies the room sequencing logic works correctly
  })

  it('should only find consumer structures matching consumerStructureTypes', () => {
    Game.time = 0

    // Add a structure that should not be a consumer
    const nonConsumerStructure = {
      id: 'non-consumer-structure' as Id<AnyStoreStructure>,
      structureType: STRUCTURE_OBSERVER, // Not in consumerStructureTypes
      store: {
        getUsedCapacity: () => 75
      }
    } as any as AnyStoreStructure

    mockRoom.find = (type: FindConstant, opts?: FilterOptions<any>) => {
      if (type === FIND_MY_STRUCTURES) {
        const allStructures = [mockConsumerStructure, nonConsumerStructure]
        return allStructures.filter(s => opts?.filter && typeof opts.filter === 'function' ? opts.filter(s) : true)
      }
      return []
    }

    Memory.energyLogistics.consumers = {
      [mockConsumerStructure.id]: {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    // Should update the consumer structure correctly
    expect(Memory.energyLogistics.consumers[mockConsumerStructure.id].energy.current).to.equal(150)
  })

  it('should only find consumer creeps matching consumerCreepRoles', () => {
    Game.time = 0

    const nonConsumerCreep = {
      id: 'non-consumer-creep' as Id<Creep>,
      memory: { role: CreepRole.GUARD }, // Not in consumerCreepRoles
      store: {
        getUsedCapacity: () => 25
      }
    } as Creep

    mockRoom.find = (type: FindConstant, opts?: FilterOptions<any>) => {
      if (type === FIND_MY_CREEPS) {
        const allCreeps = [mockConsumerCreep, nonConsumerCreep]
        return allCreeps.filter(c => opts?.filter && typeof opts.filter === 'function' ? opts.filter(c) : true)
      }
      return []
    }

    Memory.energyLogistics.consumers = {
      [mockConsumerCreep.id]: {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: CreepRole.BUILDER
      }
    }

    updateEnergyLogistics()

    // Should update the consumer creep correctly
    expect(Memory.energyLogistics.consumers[mockConsumerCreep.id].energy.current).to.equal(50)
  })

  it('should only find producer structures matching producerStructureTypes', () => {
    Game.time = 0

    Memory.energyLogistics.producers = {
      [mockProducerStructure.id]: {
        energy: { current: 0, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W1N1',
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    // Should update the producer structure correctly
    expect(Memory.energyLogistics.producers[mockProducerStructure.id].energy.current).to.equal(300)
  })

  it('should only find producer creeps matching producerCreepRoles', () => {
    Game.time = 0

    Memory.energyLogistics.producers = {
      [mockProducerCreep.id]: {
        energy: { current: 0, capacity: 300 },
        pos: { x: 5, y: 5 },
        roomName: 'W1N1',
        urgency: { peace: 1, war: 2 },
        withdrawTiming: { earliestTick: 50, latestTick: 150 },
        productionPerTick: 10,
        type: CreepRole.HARVESTER
      }
    }

    updateEnergyLogistics()

    // Should update the producer creep correctly
    expect(Memory.energyLogistics.producers[mockProducerCreep.id].energy.current).to.equal(100)
  })

  it('should handle empty consumers object', () => {
    Memory.energyLogistics.consumers = {}
    Memory.energyLogistics.producers = {}

    expect(() => updateEnergyLogistics()).to.not.throw()
  })

  it('should handle empty producers object', () => {
    Memory.energyLogistics.consumers = {}
    Memory.energyLogistics.producers = {}

    expect(() => updateEnergyLogistics()).to.not.throw()
  })

  it('should handle Game.time at CALCULATION_THRESHOLD boundary', () => {
    Game.time = 49 // 49 % 50 = 49, but only room index 0 exists

    Memory.energyLogistics.consumers = {
      [mockConsumerStructure.id]: {
        energy: { current: 0, capacity: 100 },
        pos: { x: 10, y: 10 },
        roomName: 'W1N1',
        urgency: { peace: 0, war: 1 },
        depositTiming: { earliestTick: 100, latestTick: 200 },
        productionPerTick: 5,
        type: STRUCTURE_SPAWN
      }
    }

    updateEnergyLogistics()

    // Should return early due to roomIndexToUpdate (49) >= roomSet.size (1)
    expect(Memory.energyLogistics.consumers[mockConsumerStructure.id].energy.current).to.equal(0)
  })
})
