export const deleteUnusedMemory = () => {
    // Automatically delete memory of missing creeps & associated reservations
    for (const creepName in Memory.creeps) {
    if (!(creepName in Game.creeps)) {
      delete Memory.creeps[creepName]
      delete Memory.production.energy[creepName]
      delete Memory.reservations.energy[creepName]
      delete Memory.reservations.tasks[creepName]
      delete Memory.energyLogistics.carriers[creepName]

      for (const storeName in Memory.energyLogistics.stores) {
        delete Memory.energyLogistics.stores[storeName].reservations[creepName]
      }
    }
  }
}