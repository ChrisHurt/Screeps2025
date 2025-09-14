import { Carrier, Consumer, Producer, Store } from "types"


// -- Collection Logic --
// Best destination for a carrier is the one which is closest
// Best carrier for a destination is the one which is closest
// Destinations decide in order of urgency

interface CarrierMatch {
    carrierIndex: number
    distance: number
    path: RoomPosition[]
}

interface DestinationMatch {
    destinationIndex: number
    distance: number
    path: RoomPosition[]
}

type ProposalMap = Map<number, CarrierMatch> // Map from destinationIndex -> { carrierIndex, distance }. Stores the best proposal for each destination.

interface MatchLogisticsTasksInput {
    carriers: Carrier[]
    destinations: (Consumer |Store | Producer)[]
}

interface MatchLogisticsTasksOutput {
    remainingCarriers: Carrier[]
    remainingDestinations: (Consumer |Store | Producer)[]
}

export const matchLogisticsTasks = ({ carriers=[], destinations=[] }: MatchLogisticsTasksInput): MatchLogisticsTasksOutput => {

    const carrierMatches = new Map<number, DestinationMatch>()
    const destinationMatches = new Map<number, CarrierMatch>()

    let unmatchedCarrierIndices = new Set<number>(Array.from({ length: carriers.length }, (_, index) => index))

    while(unmatchedCarrierIndices.size > 0){
        const availableDestination = destinations.filter((_, index) => !destinationMatches.has(index))

        if (availableDestination.length === 0) break

        const destinationProposals: ProposalMap = new Map() // Stores the best proposal for each destination.
        const destinationGoals = availableDestination.map(destination => ({ pos: new RoomPosition(destination.pos.x, destination.pos.y, destination.roomName), range: 1 }))

        // If no destinations available, break out of the loop

        for(const carrierIndex of unmatchedCarrierIndices) {
            const carrierRoomPosition = new RoomPosition(carriers[carrierIndex].pos.x, carriers[carrierIndex].pos.y, carriers[carrierIndex].roomName)
            const pathResult = PathFinder.search(
                carrierRoomPosition,
                destinationGoals,
                { plainCost: 2, swampCost: 10, maxOps: 2000 }
            )

            if(!pathResult.incomplete && pathResult.path.length > 0) {
                const destinationPos = pathResult.path[pathResult.path.length - 1]
                const destinationIndex = destinations.findIndex(destination => destination.pos.x === destinationPos.x && destination.pos.y === destinationPos.y && destination.roomName === destinationPos.roomName)
                const distance = pathResult.path.length

                const currentProposal = destinationProposals.get(destinationIndex)
                if(!currentProposal || distance < currentProposal.distance) {
                    destinationProposals.set(destinationIndex, { carrierIndex, distance, path: pathResult.path })
                }
            }
        }

        const newlyMatchedCarriers = new Set<number>()
        destinationProposals.forEach((proposal, destinationIndex) => {
            const carrierIndex = proposal.carrierIndex
            carrierMatches.set(carrierIndex, { destinationIndex: destinationIndex, distance: proposal.distance, path: proposal.path })
            destinationMatches.set(destinationIndex, { carrierIndex, distance: proposal.distance, path: proposal.path })
            newlyMatchedCarriers.add(carrierIndex)
        })

        newlyMatchedCarriers.forEach(carrierIndex => unmatchedCarrierIndices.delete(carrierIndex))

        if(newlyMatchedCarriers.size === 0) {
            break
        }
    }

    const finalCarrierDestinationPairs: { carrier: Carrier, destination: Store | Producer | Consumer }[] = []

    carrierMatches.forEach((match, carrierIndex) => {
        const carrier = carriers[carrierIndex]
        const destination = destinations[match.destinationIndex]
        finalCarrierDestinationPairs.push({ carrier, destination })
    })

    const remainingCarriers = carriers.filter((_, index) => !carrierMatches.has(index))
    const remainingDestinations = destinations.filter((_, index) => !destinationMatches.has(index))
    // console.log('^   Final Carrier-Destination Pairs:', JSON.stringify(finalCarrierDestinationPairs, null, 2))
    // console.log('^   Remaining Carriers & Destinations:', JSON.stringify({ remainingCarriers, remainingDestinations }, null, 2))

    return {
        remainingCarriers,
        remainingDestinations,
    }
}