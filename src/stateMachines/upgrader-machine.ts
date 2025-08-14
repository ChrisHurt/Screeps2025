import { createMachine, state, state as final, transition, reduce, ReduceFunction, Machine, MachineStates } from 'robot3'
import { SharedCreepContext, SharedCreepEventType, SharedCreepState } from 'types'

export interface UpgraderContext extends SharedCreepContext {
  energy: number
  capacity: number
}

export enum UpgraderState {
  collecting = 'collecting',
  upgrading = 'upgrading',
}

export enum UpgraderEventType {
  startCollecting = 'startCollecting',
  collected = 'collected',
  startUpgrading = 'startUpgrading',
  upgraded = 'upgraded',
  empty = 'empty',
}

export type UpgraderEvent =
  | { type: UpgraderEventType.startCollecting }
  | { type: UpgraderEventType.collected }
  | { type: UpgraderEventType.startUpgrading }
  | { type: UpgraderEventType.upgraded }
  | { type: UpgraderEventType.empty }

const setIdleTick: ReduceFunction<UpgraderContext, UpgraderEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: Game.time
})

const clearIdleTick: ReduceFunction<UpgraderContext, UpgraderEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: undefined
})

export type UpgraderMachine = Machine<
  MachineStates<{
    [SharedCreepState.idle]: {},
    [SharedCreepState.recycling]: {},
    [UpgraderState.collecting]: {},
    [UpgraderState.upgrading]: {},
  }>,
  UpgraderContext
>

type CreateUpgraderMachine = (contextFn: () => UpgraderContext, initialState?: UpgraderState | SharedCreepState) => UpgraderMachine

export const createUpgraderMachine: CreateUpgraderMachine = (contextFn, initialState = SharedCreepState.idle) =>
  createMachine(
    initialState,
    {
      [SharedCreepState.idle]: state(
        transition(UpgraderEventType.startCollecting, UpgraderState.collecting, reduce(clearIdleTick)),
        transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling),
      ),
      [UpgraderState.collecting]: state(
        transition(UpgraderEventType.collected, UpgraderState.upgrading, reduce(clearIdleTick)),
        transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick)),
      ),
      [UpgraderState.upgrading]: state(
        transition(UpgraderEventType.empty, UpgraderState.collecting, reduce(setIdleTick)),
        transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick)),
      ),
      [SharedCreepState.error]: final(),
      [SharedCreepState.recycling]: final()
    },
    contextFn,
  )
