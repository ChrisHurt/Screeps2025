import { SharedCreepState } from "types"
import { createHarvesterMachine, HarvesterContext, HarvesterEventType, HarvesterMachine, HarvesterState } from "../stateMachines/harvester-machine"
import { interpret, Service } from 'robot3'
import { checkIfUnused } from "behaviours/sharedCreepBehaviours/checkIfUnused"
import { recycle } from "behaviours/sharedCreepBehaviours/recycle"
import { depositEnergy } from "behaviours/sharedCreepBehaviours/deposit"
import { harvest } from "behaviours/harvesterBehaviours/harvest"

export function runHarvesterCreep(creep: Creep) {
  const state = (creep.memory.state || SharedCreepState.idle) as HarvesterState | SharedCreepState
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
    state: HarvesterState | SharedCreepState
}

const creepStateSpeechEmojis = {
  [SharedCreepState.idle]: '😴',
  [SharedCreepState.error]: '�',
  [SharedCreepState.recycling]: '💀',
  [HarvesterState.harvesting]: '⛏️',
  [HarvesterState.depositing]: '🏦'
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
      const harvestTaskAvailable = creepTask?.type === 'harvest' && creepTask.sourceId && creepTask.sourcePosition

      if (harvestTaskAvailable) {
        harvesterService.send({ type: HarvesterEventType.startHarvest })
        return { continue: true, state: HarvesterState.harvesting }
      }

      checkIfUnused({
        creep,
        context,
        service: harvesterService
      })

      return { continue: false, state: SharedCreepState.idle }
    case HarvesterState.harvesting:
      return harvest({
        creep,
        creepTask,
        context,
        service: harvesterService
      })
    case HarvesterState.depositing:
      return depositEnergy({
        creep,
        context,
        service: harvesterService
      })
    case SharedCreepState.recycling:
      return recycle(creep)
  }
}