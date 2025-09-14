import { Carrier, Store } from "types"


interface ClearReservationMemoryInput {
    carrierMemory: Carrier
    storeMemory: Store
}

export const clearReservationMemory = ({ carrierMemory, storeMemory}: ClearReservationMemoryInput): void => {
    delete carrierMemory.reservation
    delete storeMemory.reservations[carrierMemory.name]
}