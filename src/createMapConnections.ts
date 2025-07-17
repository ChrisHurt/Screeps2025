
// Behaviour: Creates a connections list (roomNameOne-roomNameTwo) for each connection between rooms
export const createMapConnections = (startingRoomName: string): Set<string> => {
    const mapGraph = Memory.mapRoomGraph
    const mapConnections = Memory.mapConnections

    if (!mapGraph || !mapGraph[startingRoomName] || !mapConnections) {
        console.warn(`No map graph found for starting room: ${startingRoomName}`)
        return new Set<string>()
    }

    const connections: Set<string> = new Set<string>()

    let currentRoomName: string | undefined = startingRoomName
    let neighbouringRoomNames = mapGraph[startingRoomName] || []

    const openQueue: Set<string> = new Set([currentRoomName])
    const closedQueue: Set<string> = new Set()

    while (currentRoomName) {
        neighbouringRoomNames = mapGraph[currentRoomName] || []

        for (const neighbourRoomName of neighbouringRoomNames) {
            if (!closedQueue.has(neighbourRoomName)) {
                openQueue.add(neighbourRoomName)
            }

            const sortedNames = [currentRoomName, neighbourRoomName].sort()
            const connection = `${sortedNames[0]}-${sortedNames[1]}`
            connections.add(connection)
            mapConnections.add(connection)
        }

        openQueue.delete(currentRoomName)
        closedQueue.add(currentRoomName)
        currentRoomName = openQueue.values().next().value
    }

    return connections
}