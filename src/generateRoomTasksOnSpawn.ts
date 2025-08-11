import { findFreeAdjacentPositions } from "findFreeAdjacentPositions"
import { generateTerrainArray } from "helpers/generateTerrainArray"
import { singleSourceShortestPaths } from "helpers/singleSourceShortestPath"
import { EnergyImpactType, RoomHarvestTask, RoomUpgradeTask } from "types"

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

  // NOTE: Update rooms energy production
  Memory.production.energy[spawn.id] = {
    perTickAmount: 1,
    roomNames: [roomName],
    type: EnergyImpactType.SPAWN,
  }

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
    startingPoints: sources.map(source => source.pos),
    terrainArray
  })

  roomMemory.optimumSpawnPosition = optimumSpawnPosition[0]
}