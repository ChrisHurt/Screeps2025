export const evaluateImmediateThreats = () => {
  // Implement threat evaluation logic here
  Object.values(Game.rooms).forEach(room => {
    const roomName = room.name
    const roomMemory = Memory.rooms[roomName]

    if (!roomMemory) {
      return
    }

    const lastObserved = roomMemory.threats?.lastObserved
    if (lastObserved && (Game.time - lastObserved < 5)) {
      return
    }

    // Evaluate threats in each room
    const creepThreats = room.find(FIND_HOSTILE_CREEPS)
    const powerCreepThreats = room.find(FIND_HOSTILE_POWER_CREEPS)
    const structureThreats = room.find(FIND_HOSTILE_STRUCTURES)

    console.log(`Evaluating threats in room ${roomName}:`, {
      creepThreats,
      powerCreepThreats,
      structureThreats
    })

    roomMemory.threats = {
      enemyCreepCount: creepThreats.length,
      enemyPowerCreepCount: powerCreepThreats.length,
      enemyStructures: structureThreats.map(s => s.id),
      lastObserved: Game.time
    }
  })
}
