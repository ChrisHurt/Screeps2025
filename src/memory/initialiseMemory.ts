export const initialiseMemory = () => {
    const memoryIsInitialised = Memory.memoryInitialised

    if (memoryIsInitialised) return

    Memory.creeps = {}
    Memory.energyLogistics = {
        carriers: {},
        consumers: {},
        hauling: {},
        linkGroups: {},
        producers: {},
        roomStates: {},
        stores: {},
        terminals: {},
    }
    Memory.mapConnections = []
    Memory.mapRoomGraph = {}
    Memory.memoryInitialised = true
    Memory.reservations = {
        energy: {},
        tasks: {}
    }
    Memory.rooms = {}
}