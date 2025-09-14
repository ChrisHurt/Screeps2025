import { createMachine, reduce, ReduceFunction, state, state as final, transition, Machine, MachineStates } from 'robot3'
import { CreepId, SharedCreepContext, SharedCreepEventType, SharedCreepState } from 'types'

export interface HaulerContext extends SharedCreepContext {
  energy: number
  capacity: number
  carrierId: CreepId
}

// Define the possible events for the hauler machine
export type HaulerEvent =
  | { type: SharedCreepEventType.idle }
  | { type: SharedCreepEventType.empty }
  | { type: SharedCreepEventType.full }
  | { type: SharedCreepEventType.recycleSelf }

const setIdleTick: ReduceFunction<HaulerContext, HaulerEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: Game.time
})

const clearIdleTick: ReduceFunction<HaulerContext, HaulerEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: undefined
})

export type HaulerMachineStateTypes =
    | SharedCreepState.idle
    | SharedCreepState.collectingEnergy
    | SharedCreepState.depositingEnergy
    | SharedCreepState.error
    | SharedCreepState.recycling

export type HaulerMachine = Machine<MachineStates<Record<HaulerMachineStateTypes, {}>>, HaulerContext>
type CreateHaulerMachine = (contextFn: () => HaulerContext, initialState?: HaulerMachineStateTypes) => HaulerMachine

export const createHaulerMachine: CreateHaulerMachine = (contextFn: () => HaulerContext, initialState = SharedCreepState.idle) =>
  createMachine(
    initialState,
      {
          [SharedCreepState.idle]: state(
              transition(SharedCreepEventType.empty, SharedCreepState.collectingEnergy, reduce(clearIdleTick)),
              transition(SharedCreepEventType.full, SharedCreepState.depositingEnergy, reduce(clearIdleTick)),
              transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling)
          ),
          [SharedCreepState.collectingEnergy]: state(
              transition(SharedCreepEventType.full, SharedCreepState.idle, reduce(setIdleTick)),
              transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick))
          ),
          [SharedCreepState.depositingEnergy]: state(
              transition(SharedCreepEventType.empty, SharedCreepState.idle, reduce(setIdleTick)),
              transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick))
          ),
          [SharedCreepState.error]: final(),
          [SharedCreepState.recycling]: final()
      },
      contextFn,
  )
