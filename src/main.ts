import { createMapConnections } from "createMapConnections"
import { evaluateRoom as roomValuation } from "evaluateRoom"
import { generateRoomTasksOnSpawn } from "generateRoomTasksOnSpawn"
import { renderMapConnections } from "renderMapConnections"
import { initialiseMemory } from "initialiseMemory"
import { spawnCreeps } from "spawnCreeps"
import { ErrorMapper } from "utils/ErrorMapper"
import { runHarvesterCreep } from "creepProcessors/harvester"
import { CreepRole } from "types"
import { isEmpty } from "lodash"
import { runUpgraderCreep } from "creepProcessors/upgrader"
import { calculateEnergyProductionByRoom } from "helpers/calculateEnergyProductionByRoom"

export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`\nCurrent game tick is ${Game.time}`)

  // Automatically delete memory of missing creeps
  for (const creepName in Memory.creeps) {
    if (!(creepName in Game.creeps)) {
      delete Memory.creeps[creepName]
      delete Memory.production.energy[creepName]
      delete Memory.reservations.energy[creepName]
      delete Memory.reservations.tasks[creepName]
    }
  }

  const memoryIsInitialised = Memory.memoryInitialised

  if (!memoryIsInitialised) {
    initialiseMemory()
  }

  calculateEnergyProductionByRoom()

  if(Memory.mapConnections.length === 0) {
    createMapConnections()
  } else {
    renderMapConnections()
  }

  if (isEmpty(Memory.rooms)) {
    const startingRoomName = Object.keys(Game.rooms)[0]
    roomValuation(startingRoomName)
    generateRoomTasksOnSpawn(startingRoomName)
  }

  spawnCreeps()

  // Process creeps
  for (const name in Game.creeps) {
    const creep = Game.creeps[name]

    switch (creep.memory?.role) {
      case CreepRole.HARVESTER:
        console.log(`Processing harvester creep: ${creep.name}: role: ${creep.memory.role}, state: ${creep.memory.state}`)
        runHarvesterCreep(creep)
        break
      case CreepRole.UPGRADER:
        console.log(`Processing upgrader creep: ${creep.name}: role: ${creep.memory.role}, state: ${creep.memory.state}`)
        runUpgraderCreep(creep)
        break
      // Add cases for other roles as needed
      default:
        console.log(`Creep ${name} has invalid role, skipping`)
        break
    }
  }

  // Initial map calculations
  // - Add rooms for evaluation to the evaluation queue as low priority tasks

  // Evaluate Threats
  // Identify threats in perimeter rooms and in newly scouted rooms with a period of 10 ticks since last check
  // Evaluate current structure needs
  // Evaluate current creep needs
  // Add items to Task Queue
  // Process structure behaviours
  // Process existing creeps behaviour

  // Analyse new rooms and evaluate their potential for direction-dependent remote gathering or expansion
  // Analyse existing rooms when all connections have complete internal evaluations
})
