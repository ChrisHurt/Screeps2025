export const calculateEnergyProductionByRoom = () => {
    const productionByRoom: Record<string, number> = Object.values(Memory.production.energy).reduce<Record<string, number>>((roomTotals, { perTickAmount, roomNames }) => {
        roomNames?.forEach(roomName => {
            roomTotals[roomName] = (roomTotals[roomName] || 0) + perTickAmount / roomNames.length
        })
        return roomTotals
    }, {})

    console.log(`\nEnergy production by room:`)

    Object.entries(productionByRoom).forEach(([roomName, amount]) => {
        console.log(`\t${roomName}: ${amount}`)
        Memory.rooms[roomName].effectiveEnergyPerTick = amount
    })

    const total = Object.values(productionByRoom).reduce((sum, amount) => sum + amount, 0)
    console.log(`\n\tTotal: ${total}`)
    return productionByRoom
}