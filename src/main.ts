import { createMapConnections } from "createMapConnections"
import { evaluateRoom as roomValuation } from "evaluateRoom"
import { generateRoomTasksOnSpawn } from "generateRoomTasksOnSpawn"
import { renderMapConnections } from "renderMapConnections"
import { initialiseMemory } from "initialiseMemory"
import { spawnCreeps } from "spawning/spawnCreeps"
import { ErrorMapper } from "utils/ErrorMapper"
import { Store } from "types"
import { isEmpty } from "lodash"
import { calculateEnergyProductionByRoom } from "helpers/calculateEnergyProductionByRoom"
import { evaluateImmediateThreats } from "evaluateImmediateThreats"
import { generateContainerTasks } from "generateContainerTasks"
import { updateEnergyLogistics } from "helpers/logistics/updateEnergyLogistics"
import { discoverLogisticTasks } from "helpers/logistics/discoverLogisticTasks"
import { matchLogisticsTasks } from "helpers/logistics/matchLogisticsTasks"
import { runCreepBehaviours } from "runCreepBehaviours"
import { deleteUnusedMemory } from "deleteUnusedMemory"


// TODO: Add spawn to stores with `addStoreToEnergyLogistics`
// TODO: Get hauler pickups operational
// TODO: Get hauler dropoffs operational

export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`\nCurrent game tick is ${Game.time}`)

  initialiseMemory()

  deleteUnusedMemory()

  calculateEnergyProductionByRoom()

  if(Memory.mapConnections.length === 0) {
    createMapConnections()
  } else {
    renderMapConnections()
  }

  if (isEmpty(Memory.rooms)) {
    const startingRoomName = Object.keys(Game.rooms)[0]
    roomValuation(startingRoomName)
    generateRoomTasksOnSpawn(startingRoomName)
  }


  // TODO: Incidental deposit for harvesters
  // TODO: Move this allocation block into it's own function
  // TODO: Consider Active carriers count as reservations against stores
  const {
    averageHaulingDistancePerRoom,
    carriersByRoom,
    dynamicEnergyDemandByRoom,
    dynamicEnergySupplyByRoom,
    consumersByRoom,
    storesByRoom
  } = discoverLogisticTasks()

  updateEnergyLogistics()

  for(const roomName in Game.rooms){
    if(!carriersByRoom[roomName]) continue
    const {
      idle: {
        fullCarriers: idleFullCarriers,
        emptyCarriers: idleEmptyCarriers
      },
    } = carriersByRoom[roomName]

    const {
      dueConsumers,
      overdueConsumers,
      totalEnergyDemand
    } = consumersByRoom[roomName] || []
    const stores = storesByRoom[roomName] || [] // 0 .. n (Highest energy first)

    let remainingStores = [...stores].reverse() // 0 .. n (Lowest energy first)

    console.log('Stores', JSON.stringify({ storesByRoom, stores }))

    // Energy delivery allocation
    // console.log('Idle Full Carriers & Overdue Consumers:', JSON.stringify({
    //   carriers: idleFullCarriers,
    //   destinations: overdueConsumers,
    // }, null, 2))
    let { remainingCarriers: idleFullCarriersAfterOverdue } = matchLogisticsTasks({
      carriers: idleFullCarriers,
      destinations: overdueConsumers,
    })

    if(idleFullCarriersAfterOverdue.length > 0) {
      // console.log('Idle Full Carriers & Due Consumers:', JSON.stringify({
      //   carriers: idleFullCarriersAfterOverdue,
      //   destinations: dueConsumers,
      // }, null, 2))
      const { remainingCarriers: idleFullCarriersAfterDue } = matchLogisticsTasks({
        carriers: idleFullCarriersAfterOverdue,
        destinations: dueConsumers,
      })

      if(idleFullCarriersAfterDue.length > 0) {
        // console.log('Idle Full Carriers & Remaining Stores:', JSON.stringify({
        //   carriers: idleFullCarriersAfterDue,
        //   destinations: remainingStores,
        // }, null, 2))
        const { remainingDestinations: destinationsAfterStorePickup } = matchLogisticsTasks({
          carriers: idleFullCarriersAfterDue,
          destinations: remainingStores.reverse(), // Reverse to prioritise fullest stores
        })

        remainingStores = [...destinationsAfterStorePickup].reverse() as Store[] // 0 .. n (Highest energy first)
      }
    }

    // console.log('Idle Empty Carriers & Remaining Stores:', JSON.stringify({
    //     carriers: idleEmptyCarriers,
    //     destinations: remainingStores,
    //   }, null, 2))
    // TODO: Experiment with debouncing store pickups and leveraging urgency to prevent pickup/dropoff ping-pong
    matchLogisticsTasks({
      carriers: idleEmptyCarriers,
      destinations: remainingStores,
    })
  }

  runCreepBehaviours()

  evaluateImmediateThreats()
  spawnCreeps()

  for (const roomName in Memory.rooms) {
    const roomMemory = Memory.rooms[roomName]
    const roomStructures = roomMemory.structures

    if (!roomStructures?.containers.sources && Game.rooms[roomName]) {
      generateContainerTasks({ room: Game.rooms[roomName], roomMemory })
    }
  }
})
