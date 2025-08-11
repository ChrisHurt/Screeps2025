export const initialiseMemory = () => {
    Memory.creeps = {}
    Memory.mapConnections = []
    Memory.mapRoomGraph = {}
    Memory.memoryInitialised = true
    Memory.powerCreeps = {}
    Memory.rooms = {}
    Memory.production = {
        energy: {}
    }
    Memory.reservations = {
        energy: {},
        tasks: {}
    }
}