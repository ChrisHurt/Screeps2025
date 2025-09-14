import { runBuilderCreep } from "creepProcessors/builder"
import { runGuardCreep } from "creepProcessors/guard"
import { runHarvesterCreep } from "creepProcessors/harvester"
import { runHaulerCreep } from "creepProcessors/hauler"
import { runUpgraderCreep } from "creepProcessors/upgrader"
import { CreepRole } from "types"


export const runCreepBehaviours = () => {
  for (const name in Game.creeps) {
    const creep = Game.creeps[name]

    if (!creep.memory.role) {
      console.log(`Creep ${name} has invalid role, skipping`)
      continue
    }

    if (creep.memory.role === CreepRole.HARVESTER) {
      console.log(`Processing harvester creep: ${creep.name}: role: ${creep.memory.role}, state: ${creep.memory.state}`)
      runHarvesterCreep(creep)
    } else if (creep.memory.role === CreepRole.UPGRADER) {
      console.log(`Processing upgrader creep: ${creep.name}: role: ${creep.memory.role}, state: ${creep.memory.state}`)
      runUpgraderCreep(creep)
    } else if (creep.memory.role === CreepRole.GUARD) {
      console.log(`Processing guard creep: ${creep.name}: role: ${creep.memory.role}, state: ${creep.memory.state}`)
      runGuardCreep(creep)
    } else if (creep.memory.role === CreepRole.BUILDER) {
      console.log(`Processing builder creep: ${creep.name}: role: ${creep.memory.role}, state: ${creep.memory.state}`)
      runBuilderCreep(creep)
    } else if (creep.memory.role === CreepRole.HAULER) {
      console.log(`Processing hauler creep: ${creep.name}: role: ${creep.memory.role}, state: ${creep.memory.state}`)
      runHaulerCreep(creep)
    } else {
      console.log(`Creep ${name} has invalid role, skipping`)
    }
  }
}