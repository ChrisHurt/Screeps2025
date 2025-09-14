import { Carrier } from "types"

interface RenewAdjacentCarrierInput {
    carrierMemory: Carrier
    creep: Creep
    spawn: StructureSpawn
}

export const renewAdjacentCarrier = ({ carrierMemory, creep, spawn }: RenewAdjacentCarrierInput): void => {
    const gameTime = Game.time
    const carrierNeedsRenewal = gameTime > carrierMemory.decayTiming.earliestTick

    if (!carrierNeedsRenewal) return

    const spawnCanAct = spawn && !spawn.spawning

    if(!spawnCanAct) return

    const RENEW_RESULT = spawn.renewCreep(creep)

    if (RENEW_RESULT !== OK) {
        console.log(`Failed to renew carrier ${creep.name} at spawn ${spawn.id}: ${RENEW_RESULT}`)
        return
    }

    carrierMemory.decayTiming.earliestTick = gameTime + CREEP_LIFE_TIME - (creep.ticksToLive || 0) + carrierMemory.decayTiming.threshold
    carrierMemory.decayTiming.latestTick = gameTime + (creep.ticksToLive || 0)
}