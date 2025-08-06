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

  const harvesterService = interpret(createHarvesterMachine(() => context, state), () => {})

  let creepShouldContinue = false
  let finalState = state
  let permittedIterations = 10 // Limit iterations to prevent infinite loops
  do {
    const { continue: shouldContinue, state } = processCurrentHarvesterState(creep, harvesterService)
    creepShouldContinue = shouldContinue
    finalState = state
  } while (creepShouldContinue && permittedIterations-- > 0)
  creep.memory.state = finalState
  creep.say(`${creepStateSpeechEmojis[finalState]}`, false)
}

interface ProcessCurrentHarvesterStateOutput {
    continue: boolean
    state: HarvesterState
}

const creepStateSpeechEmojis = {
  [HarvesterState.idle]: '😴',
  [HarvesterState.harvesting]: '⛏️',
  [HarvesterState.depositing]: '🏗'
}

const processCurrentHarvesterState = (creep: Creep, harvesterService: Service<HarvesterMachine>): ProcessCurrentHarvesterStateOutput => {
  const context = harvesterService.context
  const creepTask = creep.memory.task

  switch (harvesterService.machine.current) {
    /* istanbul ignore next */
    default:
      console.log(`Unknown harvester state: ${harvesterService.machine.current}`)
      return { continue: false, state: HarvesterState.idle }
    case HarvesterState.idle:
      const harvestTaskAvailable = creepTask?.type === 'harvest' && creepTask.sourceId && creepTask.sourcePosition

      if (harvestTaskAvailable) {
        harvesterService.send({ type: HarvesterEventType.startHarvest })
        return { continue: true, state: HarvesterState.harvesting }
      }
      const idleForTooLong = Game.time - (context.idleStarted || 0) > 50
      if (idleForTooLong) {
        // NOTE: If idle for too long, consider recycling or other actions
        console.log(`Creep ${creep.name} has been idle for too long, recycling.`)
      //   harvesterService.send({ type: HarvesterEventType.recycleSelf })
      }

      return { continue: false, state: HarvesterState.idle }
    case HarvesterState.harvesting:
      const isFull = context.energy >= context.capacity

      if (isFull) {
        harvesterService.send({ type: HarvesterEventType.full })
        return { continue: true, state: HarvesterState.depositing }
      }

      if (!creepTask || creepTask.type !== 'harvest') {
        console.log(`Invalid creep task for harvesting: ${JSON.stringify(creepTask)}`)
        return { continue: false, state: HarvesterState.idle }
      }

      const {
        sourceId,
        sourcePosition,
      } = creepTask

      const source = creep.room.find(FIND_SOURCES).find(s => s.id === sourceId)

      if (!source) {
        console.log(`Source with ID ${sourceId} not found for creep ${creep.name}`)

        harvesterService.send({ type: HarvesterEventType.stopHarvest })

        return { continue: false, state: HarvesterState.idle }
      }

      const isAdjacentToSource = creep.pos.isNearTo(sourcePosition)

      if (!isAdjacentToSource) {
        creep.moveTo(sourcePosition.x, sourcePosition.y, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } })
      }
      creep.harvest(source)

      return { continue: false, state: HarvesterState.harvesting }
    case HarvesterState.depositing:
      // Handle depositing logic
      // ...your depositing logic here...
      const isEmpty = context.energy === 0
      if (isEmpty) {
        harvesterService.send({ type: HarvesterEventType.deposited })
        return { continue: true, state: HarvesterState.idle }
      }

      const spawn = creep.room.find(FIND_MY_SPAWNS)[0]
      const isAdjacentToSpawn = spawn && creep.pos.isNearTo(spawn)

      if (!isAdjacentToSpawn) {
        creep.moveTo(spawn.pos.x, spawn.pos.y, { reusePath: 5, visualizePathStyle: { stroke: '#fff' } })
      }

      spawn && creep.transfer(spawn, RESOURCE_ENERGY)

      //   - Move to depositing position
      //   - Deposit energy
      return { continue: false, state: HarvesterState.depositing }
  }
}