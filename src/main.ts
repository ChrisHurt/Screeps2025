import { createMapConnections } from "createMapConnections"
import { renderMapConnections } from "renderMapConnections"
import { ErrorMapper } from "utils/ErrorMapper"

export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`\nCurrent game tick is ${Game.time}`)

  const memoryIsInitialised = Memory.memoryInitialised

  if (!memoryIsInitialised) {
    Memory.initialCalculationsDone = false
    Memory.mapConnections = []
    Memory.mapRoomGraph = {}
    Memory.memoryInitialised = true
    Memory.queues = {
      evaluations: { head: null, tail: null, rankedQueue: { high: {}, medium: {}, low: {} } },
      structures: { head: null, tail: null, rankedQueue: { high: {}, medium: {}, low: {} } },
      creeps: { head: null, tail: null, rankedQueue: { high: {}, medium: {}, low: {} } }
    }
  }

  if (!Memory.initialCalculationsDone) {
    createMapConnections()

    Memory.initialCalculationsDone = true
  } else {
    renderMapConnections()
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

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name]
    }
  }
})
