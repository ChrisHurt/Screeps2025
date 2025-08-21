import { createMachine, reduce, ReduceFunction, state, state as final, transition, Machine, MachineStates } from 'robot3'
import { SharedCreepContext, SharedCreepEventType, SharedCreepState } from "types"

export interface BuilderContext extends SharedCreepContext {
    energy: number
    capacity: number
}

export enum BuilderEventType {
  buildTarget = 'buildTarget',
  noBuildTarget = 'noBuildTarget',
  energyDepleted = 'energyDepleted',
  energyCollected = 'energyCollected',
}

export type BuilderEvent =
    | { type: SharedCreepEventType.empty }
    | { type: SharedCreepEventType.full }
    | { type: BuilderEventType.buildTarget }
    | { type: BuilderEventType.noBuildTarget }

const setIdleTick: ReduceFunction<BuilderContext, BuilderEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: Game.time
})

const clearIdleTick: ReduceFunction<BuilderContext, BuilderEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: undefined
})

export type BuilderMachineStateTypes =
    | SharedCreepState.idle
    | SharedCreepState.building
    | SharedCreepState.collectingEnergy
    | SharedCreepState.error
    | SharedCreepState.recycling

type BuilderMachineStates = Record<BuilderMachineStateTypes,{}>

export type BuilderMachine = Machine<MachineStates<BuilderMachineStates>, BuilderContext>
type CreateGuardMachine = (contextFn: () => BuilderContext, initialState?: BuilderMachineStateTypes) => BuilderMachine

export const createBuilderMachine: CreateGuardMachine = (contextFn: () => BuilderContext, initialState = SharedCreepState.idle): BuilderMachine =>
  createMachine(
    initialState,
    {
      [SharedCreepState.idle]: state(
        transition(BuilderEventType.buildTarget, SharedCreepState.building, reduce(clearIdleTick)),
        transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling, reduce(clearIdleTick))
      ),
      [SharedCreepState.building]: state(
        transition(SharedCreepEventType.empty, SharedCreepState.collectingEnergy),
        transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick))
      ),
      [SharedCreepState.collectingEnergy]: state(
        transition(SharedCreepEventType.full, SharedCreepState.building),
        transition(SharedCreepEventType.idle, SharedCreepState.idle, reduce(setIdleTick))
      ),
      [SharedCreepState.error]: final(),
      [SharedCreepState.recycling]: final()
    },
    contextFn,
  )
