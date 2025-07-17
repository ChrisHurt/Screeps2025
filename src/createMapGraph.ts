type CreateMapGraph = () => void

export const createMapGraph: CreateMapGraph = () => {
    for (const roomName in Game.rooms) {
        Memory.mapRoomGraph[roomName] = []

        const roomExits: string[] = Memory.mapRoomGraph[roomName]
        const adjacentRooms: ExitsInformation = Game.map.describeExits(roomName)

        for (const exitKey of Object.keys(adjacentRooms) as ExitKey[]) {
            const adjacentRoomName = adjacentRooms[exitKey]
            adjacentRoomName && roomExits.push(adjacentRoomName)
        }
    }
}