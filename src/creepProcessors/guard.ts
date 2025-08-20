import { SharedCreepEventType, SharedCreepState } from "types"
import { createGuardMachine, GuardContext, GuardMachine, GuardMachineStateTypes } from "../stateMachines/guard-machine"
import { interpret, Service } from 'robot3'
import { recycle } from "behaviours/sharedCreepBehaviours/recycle"
import { basicMeleeAttack } from "behaviours/sharedCreepBehaviours/basicMeleeAttack"
import { checkIfUnused } from "behaviours/sharedCreepBehaviours/checkIfUnused"

export function runGuardCreep(creep: Creep) {
  const state = (creep.memory.state || SharedCreepState.idle) as GuardMachineStateTypes
  const context: GuardContext = {
    idleStarted: creep.memory.idleStarted
  }

  const guardService = interpret(createGuardMachine(() => context, state), () => {})

  let creepShouldContinue = false
  let finalState = state
  let permittedIterations = 10 // Limit iterations to prevent infinite loops
  do {
    const { continue: shouldContinue, state } = processCurrentGuardState(creep, guardService)
    creepShouldContinue = shouldContinue
    finalState = state
  } while (creepShouldContinue && permittedIterations-- > 0)
  creep.memory.state = finalState
  creep.say(`${creepStateSpeechEmojis[finalState]}`, false)
}

interface ProcessCurrentGuardStateOutput {
    continue: boolean
    state: GuardMachineStateTypes
}

const creepStateSpeechEmojis: Record<GuardMachineStateTypes, string> = {
  [SharedCreepState.attacking]: '⚔️',
  [SharedCreepState.idle]: '😴',
  [SharedCreepState.error]: '�',
  [SharedCreepState.recycling]: '💀',
}

export const processCurrentGuardState = (creep: Creep, guardService: Service<GuardMachine>): ProcessCurrentGuardStateOutput => {
  const context = guardService.context

  switch (guardService.machine.current) {
    /* istanbul ignore next - there is no known path to this state */
    default:
        console.log(`Unknown guard state: ${guardService.machine.current}`)
      return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.idle:
        const newHostiles = creep.room.find(FIND_HOSTILE_CREEPS)
        const hostilesPresent = !!creep.pos.findClosestByRange(newHostiles)

        if (hostilesPresent) {
            guardService.send({ type: SharedCreepEventType.hostilesEngaged })
            return { continue: true, state: SharedCreepState.attacking }
        }

        if (checkIfUnused({
            creep,
            context,
            service: guardService,
            threshold: 5
        })) {
            guardService.send({ type: SharedCreepEventType.hostilesNeutralised })
            return { continue: true, state: SharedCreepState.recycling }
        }

        return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.attacking:
        return basicMeleeAttack({ creep, service: guardService })
    case SharedCreepState.recycling:
        return recycle(creep)
  }
}
