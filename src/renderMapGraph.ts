const CENTRE_TILE = 25

export const renderMapGraph = () => {
    const connections = Memory.mapConnections || []

    for (const connection of connections) {
        const [roomNameOne, roomNameTwo] = connection.split("-")

        Game.map.visual.line(
            new RoomPosition(CENTRE_TILE, CENTRE_TILE, roomNameOne),
            new RoomPosition(CENTRE_TILE, CENTRE_TILE, roomNameTwo),
            { color: "white", width: 0.1 }
        )
    }
}