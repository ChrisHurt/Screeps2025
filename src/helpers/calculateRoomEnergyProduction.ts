export const calculateRoomEnergyProduction = (roomName: string) => {
    const roomProduction = Object.values(Memory.production.energy).reduce((total, impact) => {
        return total + (impact.roomNames.includes(roomName) ? impact.perTickAmount/impact.roomNames.length : 0)
    }, 0)

    return roomProduction
}