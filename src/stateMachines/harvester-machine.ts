
import { createMachine, reduce, ReduceFunction, state, state as final, transition, Machine, MachineStates } from 'robot3'
import { SharedCreepContext, SharedCreepEventType, SharedCreepState } from 'types'

export interface HarvesterContext extends SharedCreepContext {
  energy: number
  capacity: number
}

// Define the possible events for the harvester machine
export type HarvesterEvent =
  | { type: SharedCreepEventType.idle }
  | { type: SharedCreepEventType.empty }
  | { type: SharedCreepEventType.full }
  | { type: SharedCreepEventType.recycleSelf }

const setIdleTick: ReduceFunction<HarvesterContext, HarvesterEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: Game.time
})

const clearIdleTick: ReduceFunction<HarvesterContext, HarvesterEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: undefined
})

export type HarvesterMachineStateTypes =
    | SharedCreepState.idle
    | SharedCreepState.harvesting
    | SharedCreepState.depositing
    | SharedCreepState.error
    | SharedCreepState.recycling

export type HarvesterMachine = Machine<MachineStates<Record<HarvesterMachineStateTypes, {}>>, HarvesterContext>
type CreateHarvesterMachine = (contextFn: () => HarvesterContext, initialState?: HarvesterMachineStateTypes) => HarvesterMachine

export const createHarvesterMachine: CreateHarvesterMachine = (contextFn: () => HarvesterContext, initialState = SharedCreepState.idle) =>
  createMachine(
    initialState,
      {
          [SharedCreepState.idle]: state(
              transition(SharedCreepEventType.empty, SharedCreepState.harvesting, reduce(clearIdleTick)),
              transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling)
          ),
          [SharedCreepState.harvesting]: state(
              transition(SharedCreepEventType.full, SharedCreepState.depositing),
              transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick))
          ),
          [SharedCreepState.depositing]: state(
            transition(SharedCreepEventType.empty, SharedCreepState.idle, reduce(setIdleTick))
          ),
          [SharedCreepState.error]: final(),
          [SharedCreepState.recycling]: final()
      },
      contextFn,
  )
