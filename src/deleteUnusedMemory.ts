export const deleteUnusedMemory = () => {
  // Get the list of living creeps and structures
  const livingCreeps = Object.keys(Game.creeps)
  const livingStructures = new Set<string>()

  // Collect all living structure IDs from all rooms
  Object.values(Game.rooms).forEach(room => {
    room.find(FIND_MY_STRUCTURES).forEach(structure => {
      livingStructures.add(structure.id)
    })
    room.find(FIND_STRUCTURES, { filter: s=> s.structureType === STRUCTURE_CONTAINER }).forEach(structure => {
      livingStructures.add(structure.id)
    })
  })

  // Helper function to delete creep data from memory sections
  const deleteCreepFromMemory = (creepName: string) => {
    // Delete from Memory.creeps
    if (Memory.creeps && creepName in Memory.creeps) {
      delete Memory.creeps[creepName]
    }

    // Safely delete production energy data
    if (Memory.production?.energy && creepName in Memory.production.energy) {
      delete Memory.production.energy[creepName]
    }

    // Safely delete reservations
    if (Memory.reservations?.energy && creepName in Memory.reservations.energy) {
      delete Memory.reservations.energy[creepName]
    }

    if (Memory.reservations?.tasks && creepName in Memory.reservations.tasks) {
      delete Memory.reservations.tasks[creepName]
    }

    // Safely delete energy logistics carriers
    if (Memory.energyLogistics?.carriers && creepName in Memory.energyLogistics.carriers) {
      delete Memory.energyLogistics.carriers[creepName]
    }

    // Safely delete from energy logistics consumers
    if (Memory.energyLogistics?.consumers && creepName in Memory.energyLogistics.consumers) {
      delete Memory.energyLogistics.consumers[creepName]
    }

    // Safely delete from energy logistics producers
    if (Memory.energyLogistics?.producers && creepName in Memory.energyLogistics.producers) {
      delete Memory.energyLogistics.producers[creepName]
    }

    // Safely delete store reservations (only for this specific creep)
    if (Memory.energyLogistics?.stores) {
      for (const storeName in Memory.energyLogistics.stores) {
        const store = Memory.energyLogistics.stores[storeName]
        if (store.reservations && creepName in store.reservations) {
          delete store.reservations[creepName]
        }
      }
    }
  }
  
  // Helper function to delete structure data from memory sections
  const deleteStructureFromMemory = (structureId: string) => {
    // Safely delete production energy data
    if (Memory.production?.energy && structureId in Memory.production.energy) {
      delete Memory.production.energy[structureId]
    }

    // Safely delete reservations
    if (Memory.reservations?.energy && structureId in Memory.reservations.energy) {
      delete Memory.reservations.energy[structureId]
    }

    // Safely delete from energy logistics consumers
    if (Memory.energyLogistics?.consumers && structureId in Memory.energyLogistics.consumers) {
      delete Memory.energyLogistics.consumers[structureId]
    }

    // Safely delete from energy logistics producers
    if (Memory.energyLogistics?.producers && structureId in Memory.energyLogistics.producers) {
      delete Memory.energyLogistics.producers[structureId]
    }

    // Safely delete from energy logistics stores
    if (Memory.energyLogistics?.stores && structureId in Memory.energyLogistics.stores) {
      delete Memory.energyLogistics.stores[structureId]
    }

    // Safely delete store reservations for this structure (only for this specific structure)
    if (Memory.energyLogistics?.stores) {
      for (const storeName in Memory.energyLogistics.stores) {
        const store = Memory.energyLogistics.stores[storeName]
        if (store.reservations && structureId in store.reservations) {
          delete store.reservations[structureId]
        }
      }
    }
  }

  // Collect all creep names from all memory sections
  const allCreepNames = new Set<string>()
  
  // Add creeps from Memory.creeps
  if (Memory.creeps) {
    Object.keys(Memory.creeps).forEach(name => allCreepNames.add(name))
  }
  
  // Add creeps from Memory.production.energy (but not structure IDs)
  if (Memory.production?.energy) {
    Object.keys(Memory.production.energy).forEach(name => {
      // Only add if it looks like a creep name (not a structure ID)
      // Structure IDs are typically 24 hex characters, creep names are different
      if (!(name.length > 10 && /^[0-9a-f]+$/i.test(name))) {
        allCreepNames.add(name)
      }
    })
  }

  // Add creeps from Memory.reservations.energy (but not structure IDs)
  if (Memory.reservations?.energy) {
    Object.keys(Memory.reservations.energy).forEach(name => {
      // Only add if it looks like a creep name (not a structure ID)
      if (!(name.length > 10 && /^[0-9a-f]+$/i.test(name))) {
        allCreepNames.add(name)
      }
    })
  }

  // Add creeps from Memory.reservations.tasks (but not structure IDs)
  if (Memory.reservations?.tasks) {
    Object.keys(Memory.reservations.tasks).forEach(name => {
      // Only add if it looks like a creep name (not a structure ID)
      if (!(name.length > 10 && /^[0-9a-f]+$/i.test(name))) {
        allCreepNames.add(name)
      }
    })
  }

  // Add creeps from Memory.energyLogistics.carriers (but not structure IDs)
  if (Memory.energyLogistics?.carriers) {
    Object.keys(Memory.energyLogistics.carriers).forEach(name => {
      // Only add if it looks like a creep name (not a structure ID)
      if (!(name.length > 10 && /^[0-9a-f]+$/i.test(name))) {
        allCreepNames.add(name)
      }
    })
  }

  // Add creeps from Memory.energyLogistics.consumers (but not structure IDs)
  if (Memory.energyLogistics?.consumers) {
    Object.keys(Memory.energyLogistics.consumers).forEach(name => {
      // Only add if it looks like a creep name (not a structure ID)
      if (!(name.length > 10 && /^[0-9a-f]+$/i.test(name))) {
        allCreepNames.add(name)
      }
    })
  }

  // Add creeps from Memory.energyLogistics.producers (but not structure IDs)
  if (Memory.energyLogistics?.producers) {
    Object.keys(Memory.energyLogistics.producers).forEach(name => {
      // Only add if it looks like a creep name (not a structure ID)
      if (!(name.length > 10 && /^[0-9a-f]+$/i.test(name))) {
        allCreepNames.add(name)
      }
    })
  }

  // Note: Store reservation keys are NOT added to allCreepNames because they can be either
  // creep names OR structure IDs, and we handle them separately

  // Delete memory for any creep that's not in the living creeps list
  for (const creepName of allCreepNames) {
    if (!livingCreeps.includes(creepName)) {
      deleteCreepFromMemory(creepName)
    }
  }

  // Clean up store reservations separately for both missing creeps and missing structures
  if (Memory.energyLogistics?.stores) {
    for (const storeName in Memory.energyLogistics.stores) {
      const store = Memory.energyLogistics.stores[storeName]
      if (store.reservations) {
        // Clean up reservations for missing creeps
        for (const reservationKey in store.reservations) {
          if (livingCreeps.includes(reservationKey)) {
            // It's a creep name and the creep still exists, keep it
            continue
          } else if (allCreepNames.has(reservationKey)) {
            // It's a creep name but the creep no longer exists, remove it
            delete store.reservations[reservationKey]
          } else if (reservationKey.length > 10 && /^[0-9a-f]+$/i.test(reservationKey)) {
            // It looks like a structure ID, check if the structure still exists
            if (!livingStructures.has(reservationKey)) {
              delete store.reservations[reservationKey]
            }
          }
          // If it doesn't match any pattern, leave it alone
        }
      }
    }
  }

  // Handle structure cleanup - only delete actual structure entries
  // For stores, we need to be careful not to delete named stores like "store1"
  // Only delete stores that are keyed by actual structure IDs
  
  const allActualStructureIds = new Set<string>()
  
  // Collect actual structure IDs (not names) from specific memory sections
  if (Memory.production?.energy) {
    Object.keys(Memory.production.energy).forEach(id => {
      // Only consider entries that are not creep names and look like structure IDs
      if (!allCreepNames.has(id) && id.length > 10 && /^[0-9a-f]+$/i.test(id)) {
        allActualStructureIds.add(id)
      }
    })
  }

  if (Memory.reservations?.energy) {
    Object.keys(Memory.reservations.energy).forEach(id => {
      if (!allCreepNames.has(id) && id.length > 10 && /^[0-9a-f]+$/i.test(id)) {
        allActualStructureIds.add(id)
      }
    })
  }

  if (Memory.energyLogistics?.consumers) {
    Object.keys(Memory.energyLogistics.consumers).forEach(id => {
      if (!allCreepNames.has(id) && id.length > 10 && /^[0-9a-f]+$/i.test(id)) {
        allActualStructureIds.add(id)
      }
    })
  }

  if (Memory.energyLogistics?.producers) {
    Object.keys(Memory.energyLogistics.producers).forEach(id => {
      if (!allCreepNames.has(id) && id.length > 10 && /^[0-9a-f]+$/i.test(id)) {
        allActualStructureIds.add(id)
      }
    })
  }

  if (Memory.energyLogistics?.stores) {
    Object.keys(Memory.energyLogistics.stores).forEach(id => {
      if (!allCreepNames.has(id) && id.length > 10 && /^[0-9a-f]+$/i.test(id)) {
        allActualStructureIds.add(id)
      }
    })
  }

  // Clean up structures that no longer exist
  for (const structureId of allActualStructureIds) {
    if (!livingStructures.has(structureId)) {
      deleteStructureFromMemory(structureId)
    }
  }
}