
import { createMachine, reduce, ReduceFunction, state, state as final, transition, Machine, MachineStates } from 'robot3'
import { SharedCreepContext, SharedCreepEventType, SharedCreepState } from 'types'

export interface HarvesterContext extends SharedCreepContext {
  energy: number
  capacity: number
}

export enum HarvesterState  {
  harvesting = 'harvesting',
  depositing = 'depositing'
}

export enum HarvesterEventType {
  startHarvest = 'startHarvest',
  full = 'full',
  stopHarvest = 'stopHarvest',
  deposited = 'deposited'
}

// Define the possible events for the harvester machine
export type HarvesterEvent =
    | { type: HarvesterEventType.startHarvest }
    | { type: HarvesterEventType.full }
    | { type: HarvesterEventType.stopHarvest }
    | { type: HarvesterEventType.deposited };

const setIdleTick: ReduceFunction<HarvesterContext, HarvesterEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: Game.time
})

const clearIdleTick: ReduceFunction<HarvesterContext, HarvesterEvent> = (ctx, event) => ({
  ...ctx,
  idleStarted: undefined
})

// Define the type for the harvester state machine
export type HarvesterMachine = Machine<MachineStates<{
    [SharedCreepState.idle]: {},
    [SharedCreepState.recycling]: {},
    [HarvesterState.harvesting]: {},
    [HarvesterState.depositing]: {}
}>,HarvesterContext>
type CreateHarvesterMachine = (contextFn: () => HarvesterContext, initialState?: HarvesterState | SharedCreepState) => HarvesterMachine

export const createHarvesterMachine: CreateHarvesterMachine = (contextFn: () => HarvesterContext, initialState = SharedCreepState.idle) =>
  createMachine(
    initialState,
      {
          [SharedCreepState.idle]: state(
              transition(HarvesterEventType.startHarvest, HarvesterState.harvesting, reduce(clearIdleTick)),
              transition(SharedCreepEventType.recycleSelf, SharedCreepState.recycling)
          ),
          [HarvesterState.harvesting]: state(
              transition(HarvesterEventType.full, HarvesterState.depositing),
              transition(HarvesterEventType.stopHarvest, SharedCreepState.idle, reduce(setIdleTick))
          ),
          [HarvesterState.depositing]: state(
            transition(HarvesterEventType.deposited, SharedCreepState.idle, reduce(setIdleTick))
          ),
          [SharedCreepState.error]: final(),
          [SharedCreepState.recycling]: final()
      },
      contextFn,
  )
