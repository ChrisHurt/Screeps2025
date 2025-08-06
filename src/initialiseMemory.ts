export const initialiseMemory = () => {
    Memory.creeps = {}
    Memory.flags = {}
    Memory.mapConnections = []
    Memory.mapRoomGraph = {}
    Memory.memoryInitialised = true
    Memory.powerCreeps = {}
    Memory.rooms = {}
    Memory.spawns = {}
    Memory.queues = {
        evaluations: { head: null, tail: null, rankedQueue: [{},{},{}] },
        structures: { head: null, tail: null, rankedQueue: [{},{},{}] },
        creeps: { head: null, tail: null, rankedQueue: [{},{},{}] }
    }
}