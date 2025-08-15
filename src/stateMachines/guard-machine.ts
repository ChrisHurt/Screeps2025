
import { createMachine, reduce, ReduceFunction, state, state as final, transition, Machine, MachineStates } from 'robot3'
import { SharedCreepContext, SharedCreepEventType, SharedCreepState } from 'types'

export interface GuardContext extends SharedCreepContext {}

export enum GuardState  {
  attacking = 'attacking',
}

export enum GuardEventType {
  hostilesEngaged = 'hostilesEngaged',
  hostilesNeutralised = 'hostilesNeutralised',
  retreatOrdered = 'retreatOrdered'
}

// Define the possible events for the guard machine
export type GuardEvent =
| { type: GuardEventType.hostilesEngaged }
| { type: GuardEventType.hostilesNeutralised }
| { type: GuardEventType.retreatOrdered }

const setIdleTick: ReduceFunction<GuardContext, GuardEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: Game.time
})

const clearIdleTick: ReduceFunction<GuardContext, GuardEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: undefined
})

// Define the type for the guard state machine
export type GuardMachine = Machine<MachineStates<{
    [SharedCreepState.idle]: {},
    [GuardState.attacking]: {}
    [SharedCreepState.error]: {},
    [SharedCreepState.recycling]: {},
}>, GuardContext>
type CreateGuardMachine = (contextFn: () => GuardContext, initialState?: GuardState | SharedCreepState) => GuardMachine

export const createGuardMachine: CreateGuardMachine = (contextFn: () => GuardContext, initialState = SharedCreepState.idle) =>
  createMachine(
    initialState,
      {
          [SharedCreepState.idle]: state(
              transition(GuardEventType.hostilesEngaged, GuardState.attacking, reduce(clearIdleTick)),
              transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling, reduce(clearIdleTick))
          ),
          [GuardState.attacking]: state(
              transition(GuardEventType.hostilesNeutralised, SharedCreepState.idle, reduce(setIdleTick)),
              transition(GuardEventType.retreatOrdered, SharedCreepState.recycling)
          ),
          [SharedCreepState.error]: final(),
          [SharedCreepState.recycling]: final()
      },
      contextFn,
  )
