
import { createMachine, reduce, ReduceFunction, state, state as final, transition, Machine, MachineStates } from 'robot3'
import { SharedCreepContext, SharedCreepEventType, SharedCreepState } from 'types'

export interface GuardContext extends SharedCreepContext {}

// Define the possible events for the guard machine
export type GuardEvent =
| { type: SharedCreepEventType.hostilesEngaged }
| { type: SharedCreepEventType.hostilesNeutralised }
| { type: SharedCreepEventType.recycleSelf }

const setIdleTick: ReduceFunction<GuardContext, GuardEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: Game.time
})

const clearIdleTick: ReduceFunction<GuardContext, GuardEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: undefined
})

export type GuardMachineStateTypes =
    | SharedCreepState.idle
    | SharedCreepState.attacking
    | SharedCreepState.error
    | SharedCreepState.recycling

type GuardMachineStates = Record<GuardMachineStateTypes,{}>

// Define the type for the guard state machine
export type GuardMachine = Machine<MachineStates<GuardMachineStates>, GuardContext>
type CreateGuardMachine = (contextFn: () => GuardContext, initialState?: GuardMachineStateTypes) => GuardMachine

export const createGuardMachine: CreateGuardMachine = (contextFn: () => GuardContext, initialState = SharedCreepState.idle): GuardMachine =>
  createMachine(
    initialState,
      {
          [SharedCreepState.idle]: state(
              transition(SharedCreepEventType.hostilesEngaged, SharedCreepState.attacking, reduce(clearIdleTick)),
              transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling, reduce(clearIdleTick))
          ),
          [SharedCreepState.attacking]: state(
              transition(SharedCreepEventType.hostilesNeutralised, SharedCreepState.idle, reduce(setIdleTick)),
              transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling)
          ),
          [SharedCreepState.error]: final(),
          [SharedCreepState.recycling]: final()
      },
      contextFn,
  )
