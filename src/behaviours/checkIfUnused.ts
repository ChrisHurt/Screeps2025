import { Service } from "robot3"
import { GuardMachine } from "stateMachines/guard-machine"
import { HarvesterContext, HarvesterMachine } from "stateMachines/harvester-machine"
import { UpgraderContext, UpgraderMachine } from "stateMachines/upgrader-machine"
import { SharedCreepContext, SharedCreepEventType } from "types"

interface CheckIfUnusedParams {
  creep: Creep
  context: HarvesterContext| UpgraderContext| SharedCreepContext
  service: Service<HarvesterMachine> | Service<UpgraderMachine> | Service<GuardMachine>
  threshold?: number
}

export const checkIfUnused = ({
    creep,
    context,
    service,
    threshold = 50
}: CheckIfUnusedParams): boolean => {
  if (context.idleStarted && Game.time - context.idleStarted > threshold) {
    console.log(`Creep ${creep.name} has been idle for too long, recycling.`)
    service.send({ type: SharedCreepEventType.recycleSelf })
    return true
  }
  return false
}