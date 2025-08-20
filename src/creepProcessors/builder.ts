import { SharedCreepState, CreepRole } from "types"
import { createBuilderMachine, BuilderContext, BuilderEventType, BuilderMachine, BuilderState } from "../stateMachines/builder-machine"
import { interpret, Service } from 'robot3'
import { recycle } from "behaviours/sharedCreepBehaviours/recycle"
import { collectEnergy } from "behaviours/upgraderBehaviours/collectEnergy"

export function runBuilderCreep(creep: Creep) {
  const state = (creep.memory.state || SharedCreepState.idle) as BuilderState | SharedCreepState
  const context: BuilderContext = {
    energy: creep.store.getUsedCapacity(RESOURCE_ENERGY),
    capacity: creep.store.getCapacity(RESOURCE_ENERGY),
    idleStarted: creep.memory.idleStarted
  }

  const builderService = interpret(createBuilderMachine(() => context, state), () => {})

  let creepShouldContinue = false
  let finalState = state
  let permittedIterations = 10
  do {
    const { continue: shouldContinue, state } = processCurrentBuilderState(creep, builderService)
    creepShouldContinue = shouldContinue
    finalState = state
  } while (creepShouldContinue && permittedIterations-- > 0)
  creep.memory.state = finalState
  creep.say(`${creepStateSpeechEmojis[finalState]}`, false)
}

interface ProcessCurrentBuilderStateOutput {
  continue: boolean
  state: BuilderState | SharedCreepState
}

const creepStateSpeechEmojis = {
  [SharedCreepState.idle]: '😴',
  [SharedCreepState.error]: '�',
  [SharedCreepState.recycling]: '💀',
  [BuilderState.building]: '🚧',
  [SharedCreepState.collectingEnergy]: '🔄'
}

export const processCurrentBuilderState = (creep: Creep, builderService: Service<BuilderMachine>): ProcessCurrentBuilderStateOutput => {
  const context = builderService.context

  switch (builderService.machine.current) {
    default:
      console.log(`Unknown builder state: ${builderService.machine.current}`)
      return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.idle:
      const buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES)
      if (buildTargets.length > 0) {
        builderService.send({ type: BuilderEventType.buildTarget })
        return { continue: true, state: BuilderState.building }
      }
      // If idle too long, recycle
      if (creep.memory.idleStarted && Game.time - creep.memory.idleStarted > 50) {
        builderService.send({ type: SharedCreepState.recycling })
        return { continue: true, state: SharedCreepState.recycling }
      }
      return { continue: false, state: SharedCreepState.idle }
    case BuilderState.building:
      if (creep.store[RESOURCE_ENERGY] === 0) {
        builderService.send({ type: BuilderEventType.energyDepleted })
        return { continue: true, state: SharedCreepState.collectingEnergy }
      }
      const sites = creep.room.find(FIND_CONSTRUCTION_SITES)
      if (sites.length === 0) {
        builderService.send({ type: BuilderEventType.noBuildTarget })
        return { continue: true, state: SharedCreepState.idle }
      }
      // Prioritise by progress
      const target = sites.sort((a, b) => a.progress - b.progress)[0]
      if (creep.pos.inRangeTo(target, 3)) {
        creep.build(target)
      } else {
        creep.moveTo(target)
      }
      return { continue: false, state: BuilderState.building }
    case SharedCreepState.collectingEnergy:
      return collectEnergy({
        creep,
        context: { ...context, energy: creep.store[RESOURCE_ENERGY], capacity: creep.store.getCapacity(RESOURCE_ENERGY) },
        service: builderService as any // Type cast for compatibility
      })
    case SharedCreepState.recycling:
      return recycle(creep)
  }
}
