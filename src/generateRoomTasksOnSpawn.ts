import { findFreeAdjacentPositions } from "findFreeAdjacentPositions"
import { addConsumerStructureToEnergyLogistics } from "logistics/addConsumerStructureToEnergyLogistics"
import { addProducerStructureToEnergyLogistics } from "logistics/addProducerStructureToEnergyLogistics"
import { generateTerrainArray } from "helpers/generateTerrainArray"
import { singleSourceShortestPaths } from "helpers/singleSourceShortestPath"
import { EnergyImpactType, RoomHarvestTask, RoomUpgradeTask, Urgency } from "types"
import { addStoreToMemory } from "logistics/addStoreToEnergyLogistics"

export const generateRoomTasksOnSpawn = (roomName: string) => {
  const room = Game.rooms[roomName]

  if (!room) {
    console.log(`GenerateRoomTasksError: Cannot generate tasks for room not in Game.rooms: ${roomName}`)
    return
  }

  const controller = room.controller

  if (!controller) {
    console.log(`GenerateRoomTasksError: No controller found in room ${roomName}`)
    return
  }

  const spawn = room.find(FIND_MY_SPAWNS)[0]

  if (!spawn) {
    console.log(`GenerateRoomTasksError: No spawn found in room ${roomName}`)
    return
  }

  addStoreToMemory({
    actions: {
      collect: 'withdraw',
      deliver: 'transfer',
    },
    name: `${STRUCTURE_SPAWN}_${room.name}:${spawn.pos.x},${spawn.pos.y}`,
    energy: {
      current: 300,
      capacity: 300
    },
    pos: spawn.pos,
    storeType: STRUCTURE_SPAWN,
    structureType: STRUCTURE_SPAWN,
    roomName,
  })

  Memory.rooms[roomName] = Memory.rooms[roomName] || {}
  const roomMemory = Memory.rooms[roomName]

  // NOTE: Set rooms initial energy production
  roomMemory.effectiveEnergyPerTick = 1

  const terrainArray = generateTerrainArray(roomName)

  const upgradeTask: RoomUpgradeTask = {
    availablePositions: findFreeAdjacentPositions({
      roomPosition: controller.pos,
      terrainArray
    }),
    roomName,
    reservingCreeps: {},
    controllerId: controller.id,
    controllerPosition: controller.pos,
  }
  roomMemory.tasks = {
    build: [],
    upgrade: upgradeTask,
    harvest: []
  }

  const roomTasks = roomMemory.tasks

  const sources = room.find(FIND_SOURCES)
  roomMemory.sources = roomMemory.sources || {}
  const sourcesMemory = roomMemory.sources

  const energyGenerationPerTickCycle = sources.reduce((total, source) => {
    // NOTE:  On first tick the spawn is chosen, capacity is 1500.
    //        All ticks following capacity is 3000 after room claim.
    const sourceEnergyCapacity = source.energyCapacity === 1500 ? 3000 : source.energyCapacity
    sourcesMemory[source.id] = {
      energyGenerationPerTick: sourceEnergyCapacity / 300,
      position: source.pos
    }

    const harvestTask: RoomHarvestTask = {
      availablePositions: findFreeAdjacentPositions({
        roomPosition: source.pos,
        terrainArray
      }),
      requiredWorkParts: sourcesMemory[source.id].energyGenerationPerTick / 2, // Each WORK part harvests 2 energy per tick
      roomName: roomName,
      reservingCreeps: {},
      sourceId: source.id,
      sourcePosition: source.pos,
    }
    roomTasks.harvest.push(harvestTask)

    return total + sourceEnergyCapacity
  }, 0)

  const totalSourceEnergyPerTick = energyGenerationPerTickCycle / 300 // Source generation per tick over a 300 tick cycle

  roomMemory.totalSourceEnergyPerTick = totalSourceEnergyPerTick

  const roomMineral = room.find(FIND_MINERALS)[0]

  if (roomMineral) {
    roomMemory.mineral = {
      type: roomMineral.mineralType,
      density: roomMineral.density,
      position: roomMineral.pos,
      mineralGenerationPerTick: roomMineral.density / MINERAL_REGEN_TIME
    }
  }

  const optimumSpawnPosition = singleSourceShortestPaths({
    startingPoints: [...sources.map(source => source.pos), controller.pos],
    terrainArray
  })

  roomMemory.optimumSpawnPosition = optimumSpawnPosition[0]

  // Energy Logistics Initialisation
  Memory.energyLogistics.roomStates[roomName] = {
    isUnderAttack: false,
    energyEmergency: false,
    netEnergyProduction: 0,
    rcl: 1,
  }

  // Add Spawn to logistics as consumer & producer
  addConsumerStructureToEnergyLogistics({
    name: spawn.id,
    energy: {
      current: 300,
      capacity: 300
    },
    pos: spawn.pos,
    structureType: STRUCTURE_SPAWN,
    productionPerTick: 0, // Production will be accounted for as a producer, not consumer
    roomName
  })

  addProducerStructureToEnergyLogistics({
    name: spawn.id,
    energy: {
      current: 300,
      capacity: 300
    },
    pos: spawn.pos,
    structureType: STRUCTURE_SPAWN,
    productionPerTick: 1,
    roomName
  })
}