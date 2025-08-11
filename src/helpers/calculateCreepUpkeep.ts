import { calculateLifetimeUpkeep } from "./calculateLifetimeUpkeep"
import { calculateRenewalEfficiency } from "./calculateRenewalEfficiency"

interface CalculateCreepUpkeep {
    body: BodyPartConstant[]
    isRenewed?: boolean
}
// NOTE: Returns the cost per tick of a built creep, without renewal
export const calculateCreepUpkeep = ({ body, isRenewed = false }: CalculateCreepUpkeep) => {
    return isRenewed ? calculateRenewalEfficiency({ body }) : calculateLifetimeUpkeep({ body })
}