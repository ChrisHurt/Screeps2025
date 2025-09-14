export const deleteUnusedMemory = () => {
    // Automatically delete memory of missing creeps & associated reservations
    for (const creepName in Memory.creeps) {
    if (!(creepName in Game.creeps)) {
      delete Memory.creeps[creepName]

      // Safely delete production energy data
      if (Memory.production?.energy) {
        delete Memory.production.energy[creepName]
      }

      // Safely delete reservations
      if (Memory.reservations?.energy) {
        delete Memory.reservations.energy[creepName]
      }

      if (Memory.reservations?.tasks) {
        delete Memory.reservations.tasks[creepName]
      }

      // Safely delete energy logistics carriers
      if (Memory.energyLogistics?.carriers) {
        delete Memory.energyLogistics.carriers[creepName]
      }

      // Safely delete store reservations
      if (Memory.energyLogistics?.stores) {
        for (const storeName in Memory.energyLogistics.stores) {
          const store = Memory.energyLogistics.stores[storeName]
          if (store.reservations) {
            delete store.reservations[creepName]
          }
        }
      }
    }
  }
}