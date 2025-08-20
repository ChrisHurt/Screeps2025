import { createMachine, state, state as final, transition, reduce, ReduceFunction, Machine, MachineStates } from 'robot3'
import { SharedCreepContext, SharedCreepEventType, SharedCreepState } from 'types'

export interface UpgraderContext extends SharedCreepContext {
  energy: number
  capacity: number
}

export type UpgraderEvent =
  | { type: SharedCreepEventType.empty }
  | { type: SharedCreepEventType.full }
  | { type: SharedCreepEventType.startUpgrading }
  | { type: SharedCreepEventType.upgraded }

const setIdleTick: ReduceFunction<UpgraderContext, UpgraderEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: Game.time
})

const clearIdleTick: ReduceFunction<UpgraderContext, UpgraderEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: undefined
})

export type UpgraderMachineStateTypes =
    | SharedCreepState.idle
    | SharedCreepState.collectingEnergy
    | SharedCreepState.upgrading
    | SharedCreepState.error
    | SharedCreepState.recycling

type UpgraderMachineStates = Record<UpgraderMachineStateTypes,{}>

export type UpgraderMachine = Machine<MachineStates<UpgraderMachineStates>, UpgraderContext>
type CreateUpgraderMachine = (contextFn: () => UpgraderContext, initialState?: UpgraderMachineStateTypes) => UpgraderMachine

export const createUpgraderMachine: CreateUpgraderMachine = (contextFn, initialState = SharedCreepState.idle): UpgraderMachine =>
  createMachine(
    initialState,
    {
      [SharedCreepState.idle]: state(
        transition(SharedCreepEventType.empty, SharedCreepState.collectingEnergy, reduce(clearIdleTick)),
        transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling),
      ),
      [SharedCreepState.collectingEnergy]: state(
        transition(SharedCreepEventType.full, SharedCreepState.upgrading, reduce(clearIdleTick)),
        transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick)),
      ),
      [SharedCreepState.upgrading]: state(
        transition(SharedCreepEventType.empty, SharedCreepState.collectingEnergy, reduce(setIdleTick)),
        transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick)),
      ),
      [SharedCreepState.error]: final(),
      [SharedCreepState.recycling]: final()
    },
    contextFn,
  )
