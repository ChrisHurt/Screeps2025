import { Carrier, CarrierCreeps, creepUrgencyMatrix, Position } from "types"

interface AddCarrierCreepToEnergyLogisticsParams {
    decayTiming?: {
        earliestTick: number
        interval: number
        latestTick: number
        threshold: number
    }
    energy: {
        current: number
        capacity: number
    }
    name: string
    reservation?: Carrier['reservation']
    pos: Position
    roomName: string
    role: CarrierCreeps
}

export const addCarrierCreepToEnergyLogistics = ({
    energy,
    decayTiming = {
        earliestTick: Game.time + 200,
        interval: 1,
        latestTick: Game.time + CREEP_LIFE_TIME,
        threshold: 200
    },
    reservation,
    name,
    pos,
    role,
    roomName,
}: AddCarrierCreepToEnergyLogisticsParams): void => {
    const carrier: Carrier = {
        decayTiming,
        energy,
        name,
        pos,
        reservation,
        roomName,
        urgency: creepUrgencyMatrix[role],
        type: role
    }

    Memory.energyLogistics.carriers[name] = carrier
}