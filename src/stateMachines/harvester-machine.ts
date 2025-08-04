
import { createMachine, invoke, immediate, reduce, ReduceFunction, state, transition, Machine, MachineStates } from 'robot3'

export type HarvesterContext = {
  energy: number
  capacity: number
  idleStarted?: number
}

export enum HarvesterState {
  idle = 'idle',
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
    idle: {}
}>,HarvesterContext>
type CreateHarvesterMachine = (contextFn: () => HarvesterContext) => HarvesterMachine

export const createHarvesterMachine: CreateHarvesterMachine = (contextFn: () => HarvesterContext) =>
    createMachine({
  idle: state(
    transition(HarvesterEventType.startHarvest, HarvesterState.harvesting, reduce(clearIdleTick)),
  ),
  harvesting: state(
    transition(HarvesterEventType.full, HarvesterState.depositing),
    transition(HarvesterEventType.stopHarvest, HarvesterState.idle, reduce(setIdleTick))
  ),
  depositing: state(
    transition(HarvesterEventType.deposited, HarvesterState.idle, reduce(setIdleTick))
  )
}, contextFn)
