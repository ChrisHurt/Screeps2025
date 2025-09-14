import { SharedCreepEventType, SharedCreepState } from "types"
import { createHarvesterMachine, HarvesterContext, HarvesterMachine, HarvesterMachineStateTypes, } from "../stateMachines/harvester-machine"
import { interpret, Service } from 'robot3'
import { checkIfUnused } from "behaviours/checkIfUnused"
import { recycle } from "behaviours/recycle"
import { harvestWithMaintenance } from "behaviours/harvestWithMaintenance"
import { depositEnergyInClosestStore } from "behaviours/depositEnergyInClosestStore"

export function runHarvesterCreep(creep: Creep) {
  const state = (creep.memory.state || SharedCreepState.idle) as HarvesterMachineStateTypes
  const context: HarvesterContext = {
    energy: creep.store.getUsedCapacity(RESOURCE_ENERGY),
    capacity: creep.store.getCapacity(RESOURCE_ENERGY),
    idleStarted: creep.memory.idleStarted
  }

  const harvesterService = interpret(createHarvesterMachine(() => context, state), () => {})

  let creepShouldContinue = false
  let finalState = state
  let permittedIterations = 10 // Limit iterations to prevent infinite loops
  do {
    const { continue: shouldContinue, state } = processCurrentHarvesterState(creep, harvesterService)
    creepShouldContinue = shouldContinue
    finalState = state
  } while (creepShouldContinue && permittedIterations-- > 0)
  creep.memory.state = finalState
  creep.say(`${creepStateSpeechEmojis[finalState]}`, false)
}

interface ProcessCurrentHarvesterStateOutput {
    continue: boolean
    state: HarvesterMachineStateTypes
}

const creepStateSpeechEmojis = {
  [SharedCreepState.idle]: '😴',
  [SharedCreepState.error]: '�',
  [SharedCreepState.recycling]: '💀',
  [SharedCreepState.harvesting]: '⛏️',
  [SharedCreepState.depositingEnergy]: '🏦'
}

const processCurrentHarvesterState = (creep: Creep, harvesterService: Service<HarvesterMachine>): ProcessCurrentHarvesterStateOutput => {
  const context = harvesterService.context
  const creepTask = creep.memory.task

  if (!creepTask || creepTask.type !== 'harvest') {
    console.log(`Invalid creep task for harvester: ${JSON.stringify(creepTask)}`)
    return { continue: false, state: SharedCreepState.error }
  }

  switch (harvesterService.machine.current) {
    /* istanbul ignore next */
    default:
      console.log(`Unknown harvester state: ${harvesterService.machine.current}`)
      return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.idle:
      const harvestTaskAvailable = creepTask.type === 'harvest' && creepTask.sourceId && creepTask.sourcePosition

      if (harvestTaskAvailable) {
        harvesterService.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.harvesting }
      }

      if (checkIfUnused({
        creep,
        context,
        service: harvesterService
      })) {
        return { continue: true, state: SharedCreepState.recycling }
      }

      return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.harvesting:
      return harvestWithMaintenance({
        creep,
        creepTask,
        context,
        service: harvesterService
      })
    case SharedCreepState.depositingEnergy:
      return depositEnergyInClosestStore({
        creep,
        context,
        service: harvesterService
      })
    case SharedCreepState.recycling:
      return recycle(creep)
  }
}