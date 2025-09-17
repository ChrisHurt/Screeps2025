import { getEnergyImpacts } from "./getEnergyImpacts"

export const calculateEnergyProductionByRoom = () => {
    const energyImpacts = getEnergyImpacts()
    const productionByRoom: Record<string, number> = Object.values(energyImpacts).reduce<Record<string, number>>((roomTotals, energyImpact) => {
        const { perTickAmount, roomNames } = energyImpact
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