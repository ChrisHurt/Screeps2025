import { createHarvesterMachine, HarvesterContext, HarvesterEventType, HarvesterMachine, HarvesterState } from "./stateMachines/harvester-machine"
import { interpret, Service } from 'robot3'

const permittedStates = [HarvesterState.idle, HarvesterState.harvesting, HarvesterState.depositing]

export function runHarvesterCreep(creep: Creep) {
  const state = creep.memory.state && permittedStates.includes(creep.memory.state) ? creep.memory.state : HarvesterState.idle
  const context: HarvesterContext = {
    energy: creep.store.getUsedCapacity(RESOURCE_ENERGY),
    capacity: creep.store.getCapacity(RESOURCE_ENERGY),
    idleStarted: creep.memory.idleStarted
  }
  console.log(`Running harvester creep: ${creep.name}, state: ${state}, energy: ${context.energy}/${context.capacity}, idleStarted: ${context.idleStarted}`)
  const harvesterService = interpret(createHarvesterMachine(() => context, state), () => {})

  let creepShouldContinue = false
  let permittedIterations = 10 // Limit iterations to prevent infinite loops
  do {
    const { continue: shouldContinue } = processCurrentHarvesterState(creep, harvesterService)
    creepShouldContinue = shouldContinue
  } while (creepShouldContinue && permittedIterations-- > 0)
}

interface ProcessCurrentHarvesterStateOutput {
    continue: boolean
}

const processCurrentHarvesterState = (creep: Creep, harvesterService: Service<HarvesterMachine>): ProcessCurrentHarvesterStateOutput => {
  const context = harvesterService.context
  const creepTask = creep.memory.task

  switch (harvesterService.machine.current) {
    /* istanbul ignore next */
    default:
      console.log(`Unknown harvester state: ${harvesterService.machine.current}`)
      return { continue: false }
    case HarvesterState.idle:
      const harvestTaskAvailable = creepTask?.type === 'harvest' && creepTask.sourceId && creepTask.sourcePosition

      if (harvestTaskAvailable) {
        harvesterService.send({ type: HarvesterEventType.startHarvest })
        return { continue: true }
      }
      const idleForTooLong = Game.time - (context.idleStarted || 0) > 50
      if (idleForTooLong) {
        // NOTE: If idle for too long, consider recycling or other actions
        console.log(`Creep ${creep.name} has been idle for too long, recycling.`)
      //   harvesterService.send({ type: HarvesterEventType.recycleSelf })
      }

      // TODO: If idle for too long - move to recycle state
      return { continue: false }
    case HarvesterState.harvesting:
      const isFull = context.energy >= context.capacity

      if (isFull) {
        harvesterService.send({ type: HarvesterEventType.full })
        return { continue: true }
      }

      if (!creepTask || creepTask.type !== 'harvest') {
        console.error(`Invalid creep task for harvesting: ${JSON.stringify(creepTask)}`)
        return { continue: false }
      }

      const {
        sourceId,
        sourcePosition,
      } = creepTask

      const isAdjacentToSource = creep.pos.isNearTo(sourcePosition)

      if (!isAdjacentToSource) {
        creep.moveTo(sourcePosition, { visualizePathStyle: { stroke: '#ffaa00' } })
        return { continue: false }
      }

      const source = creep.pos.findInRange(FIND_SOURCES, 1).find(s => s.id === sourceId)
      source && creep.harvest(source)

      return { continue: false }
    case HarvesterState.depositing:
      // Handle depositing logic
      // ...your depositing logic here...
      const isEmpty = context.energy === 0
      if (isEmpty) {
        harvesterService.send({ type: HarvesterEventType.deposited })
        return { continue: true }
      }
      //   - Move to depositing position
      //   - Deposit energy
      return { continue: false }
  }
}