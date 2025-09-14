import { CreepId, SharedCreepEventType, SharedCreepState } from "types"
import { createHaulerMachine, HaulerContext, HaulerMachine, HaulerMachineStateTypes, } from "../stateMachines/hauler-machine"
import { interpret, Service } from 'robot3'
import { checkIfUnused } from "behaviours/checkIfUnused"
import { recycle } from "behaviours/recycle"
import { collectEnergyByReservation } from "behaviours/collectEnergyByReservation"
import { depositEnergyByReservation } from "behaviours/depositEnergyByReservation"

export function runHaulerCreep(creep: Creep) {
  const state = (creep.memory.state || SharedCreepState.idle) as HaulerMachineStateTypes
  const context: HaulerContext = {
    carrierId: creep.name as CreepId,
    energy: creep.store.getUsedCapacity(RESOURCE_ENERGY),
    capacity: creep.store.getCapacity(RESOURCE_ENERGY),
    idleStarted: creep.memory.idleStarted
  }

  const haulerService = interpret(createHaulerMachine(() => context, state), () => {})

  let creepShouldContinue = false
  let finalState = state
  let permittedIterations = 10 // Limit iterations to prevent infinite loops
  do {
    const { continue: shouldContinue, state } = processCurrentHaulerState(creep, haulerService)
    creepShouldContinue = shouldContinue
    finalState = state
  } while (creepShouldContinue && permittedIterations-- > 0)
  creep.memory.state = finalState
  creep.say(`${creepStateSpeechEmojis[finalState]}`, false)
}

interface ProcessCurrentHaulerStateOutput {
    continue: boolean
    state: HaulerMachineStateTypes
}

const creepStateSpeechEmojis = {
  [SharedCreepState.idle]: '😴',
  [SharedCreepState.error]: '❌',
  [SharedCreepState.recycling]: '💀',
  [SharedCreepState.collectingEnergy]: '🔄',
  [SharedCreepState.depositingEnergy]: '🏦'
}

const processCurrentHaulerState = (creep: Creep, haulerService: Service<HaulerMachine>): ProcessCurrentHaulerStateOutput => {
  const context = haulerService.context

  switch (haulerService.machine.current) {
    /* istanbul ignore next */
    default:
      console.log(`Unknown hauler state: ${haulerService.machine.current}`)
      return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.idle:
      const isFull = context.energy >= context.capacity
      const isEmpty = context.energy === 0

      // Check if we have energy and should deposit it
      if (isFull) {
        haulerService.send({ type: SharedCreepEventType.full })
        return { continue: true, state: SharedCreepState.depositingEnergy }
      }

      // Check if we're empty and should collect energy
      if (isEmpty) {
        haulerService.send({ type: SharedCreepEventType.empty })
        return { continue: true, state: SharedCreepState.collectingEnergy }
      }

      // Check if unused and should recycle
      if (checkIfUnused({
        creep,
        context,
        service: haulerService
      })) {
        return { continue: true, state: SharedCreepState.recycling }
      }

      return { continue: false, state: SharedCreepState.idle }
    case SharedCreepState.collectingEnergy:
      return collectEnergyByReservation({
        creep,
        context,
        service: haulerService
      })
    case SharedCreepState.depositingEnergy:
      return depositEnergyByReservation({
        creep,
        context,
        service: haulerService
      })
    case SharedCreepState.recycling:
      return recycle(creep)
  }
}
