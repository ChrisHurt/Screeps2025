import { SharedCreepEventType, SharedCreepState } from "types"
import { createUpgraderMachine, UpgraderContext, UpgraderMachine, UpgraderMachineStateTypes, } from "../stateMachines/upgrader-machine"
import { interpret, Service } from 'robot3'
import { recycle } from "behaviours/recycle"
import { collectEnergy } from "behaviours/collectEnergy"
import { upgradeWithMaintenance } from "behaviours/upgradeWithMaintenance"

export function runUpgraderCreep(creep: Creep) {
  const state = (creep.memory.state || SharedCreepState.idle) as UpgraderMachineStateTypes
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
  creep.memory.state = finalState
  creep.say(`${creepStateSpeechEmojis[finalState]}`, false)
}

const creepStateSpeechEmojis = {
  [SharedCreepState.idle]: '😴',
  [SharedCreepState.error]: '�',
  [SharedCreepState.recycling]: '💀',
  [SharedCreepState.collectingEnergy]: '🔋',
  [SharedCreepState.upgrading]: '⚡'
}

interface ProcessCurrentUpgraderStateOutput {
    continue: boolean
    state: UpgraderMachineStateTypes
}

const processCurrentUpgraderState = (creep: Creep, upgraderService: Service<UpgraderMachine>): ProcessCurrentUpgraderStateOutput => {
  const context = upgraderService.context
  const creepTask = creep.memory.task

  if (!creepTask || creepTask.type !== 'upgrade') {
    console.log(`Invalid creep task for upgrader: ${JSON.stringify(creepTask)}`)
    return { continue: false, state: SharedCreepState.error }
  }

  switch (upgraderService.machine.current) {
    /* istanbul ignore next */
    default:
      console.log(`Unknown upgrader state: ${upgraderService.machine.current}`)
      return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.idle:
      // TODO: Update this when collection tasking includes energy reservations
      const collectingTaskAvailable = creepTask

      // TODO: Update this when collection tasking includes energy reservations
      /* istanbul ignore next */
      if (collectingTaskAvailable) {
        upgraderService.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.collectingEnergy }
      }

      // TODO: Uncomment when collection tasking includes energy reservations
      // if(checkIfUnused({
      //   creep,
      //   context,
      //   service: upgraderService
      // })) {
      //   return { continue: true, state: SharedCreepState.recycling }
      // }

      // return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.collectingEnergy:
      return collectEnergy({
        creep,
        context,
        service: upgraderService
      })
    case SharedCreepState.upgrading:
      return upgradeWithMaintenance({ creep, context, service: upgraderService })
    case SharedCreepState.recycling:
      return recycle(creep)
  }
}
