import { SharedCreepState } from "types"
import { createUpgraderMachine, UpgraderContext, UpgraderEventType, UpgraderMachine, UpgraderState } from "../stateMachines/upgrader-machine"
import { interpret, Service } from 'robot3'
import { checkIfUnused } from "behaviours/sharedCreepBehaviours/checkIfUnused"
import { recycle } from "behaviours/sharedCreepBehaviours/recycle"
import { upgrade } from "behaviours/upgraderBehaviours/upgrade"
import { collectEnergy } from "behaviours/upgraderBehaviours/collectEnergy"

export function runUpgraderCreep(creep: Creep) {
  const state = (creep.memory.state || SharedCreepState.idle) as UpgraderState | SharedCreepState
  const context: UpgraderContext = {
    energy: creep.store.getUsedCapacity(RESOURCE_ENERGY),
    capacity: creep.store.getCapacity(RESOURCE_ENERGY),
    idleStarted: creep.memory.idleStarted
  }

  const upgraderService = interpret(createUpgraderMachine(() => context, state), () => {})

  let creepShouldContinue = false
  let finalState = state
  let permittedIterations = 10 // Limit iterations to prevent infinite loops
  do {
    const { continue: shouldContinue, state } = processCurrentUpgraderState(creep, upgraderService)
    console.log(`Upgrader iteration: ${11-permittedIterations} state: ${state}`)
    creepShouldContinue = shouldContinue
    finalState = state
  } while (creepShouldContinue && permittedIterations-- > 0)
  creep.memory.state = finalState as UpgraderState
  creep.say(`${creepStateSpeechEmojis[finalState]}`, false)
}

const creepStateSpeechEmojis = {
  [SharedCreepState.idle]: '😴',
  [SharedCreepState.error]: '�',
  [SharedCreepState.recycling]: '💀',
  [UpgraderState.collecting]: '🔋',
  [UpgraderState.upgrading]: '⚡'
}

interface ProcessCurrentUpgraderStateOutput {
    continue: boolean
    state: UpgraderState | SharedCreepState
}

const processCurrentUpgraderState = (creep: Creep, upgraderService: Service<UpgraderMachine>): ProcessCurrentUpgraderStateOutput => {
  const context = upgraderService.context
  const creepTask = creep.memory.task

  if (!creepTask || creepTask.type !== 'upgrade') {
    console.log(`Invalid creep task for upgrader: ${JSON.stringify(creepTask)}`)
    return { continue: false, state: SharedCreepState.error }
  }

  switch (upgraderService.machine.current) {
    default:
      console.log(`Unknown upgrader state: ${upgraderService.machine.current}`)
      return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.idle:
      // If we have a collecting task, start collecting
      const collectingTaskAvailable = creepTask

      if (collectingTaskAvailable) {
        upgraderService.send({ type: UpgraderEventType.startCollecting })
        return { continue: true, state: UpgraderState.collecting }
      }

      if(checkIfUnused({
        creep,
        context,
        service: upgraderService
      })) {
        return { continue: true, state: SharedCreepState.recycling }
      }

      return { continue: false, state: SharedCreepState.idle }
    case UpgraderState.collecting:
      return collectEnergy({
        creep,
        context,
        upgraderService
      })
    case UpgraderState.upgrading:
      return upgrade({ creep, context, upgraderService })
      case SharedCreepState.recycling:
        return recycle(creep)
  }
}
