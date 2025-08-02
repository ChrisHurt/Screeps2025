// Behaviour: Creates a connections list (roomNameOne-roomNameTwo) for each connection between rooms
export const createMapConnections = (): void => {
    const startingRoomName = Object.keys(Game.rooms).length && Object.keys(Game.rooms)[0]

    if (!startingRoomName) {
        console.log(`CreateMapConnectionsError: No room found, cannot create map connections.`)
        return
    }

    const mapConnections = Memory.mapConnections
    const mapRoomGraph = Memory.mapRoomGraph

    let currentRoomName: string | undefined = startingRoomName

    const openQueue: Set<string> = new Set([currentRoomName])
    const closedQueue: Set<string> = new Set()

    while (currentRoomName) {
        mapRoomGraph[currentRoomName] = Object.values(Game.map.describeExits(currentRoomName)).filter((roomName): roomName is string => !!roomName)


        for (const neighbourRoomName of mapRoomGraph[currentRoomName]) {
            if (closedQueue.has(neighbourRoomName)) {
                continue
            }

            openQueue.add(neighbourRoomName)

            const sortedNames = [currentRoomName, neighbourRoomName].sort()
            const connection = `${sortedNames[0]}-${sortedNames[1]}`
            mapConnections.push(connection)
        }

        openQueue.delete(currentRoomName)
        closedQueue.add(currentRoomName)
        currentRoomName = openQueue.values().next().value
    }
}