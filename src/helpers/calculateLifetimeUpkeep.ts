import { calculateBodyCost } from "./calculateBodyCost"

interface CalculateRenewalCost {
    body: BodyPartConstant[]
}
// NOTE: Returns the cost per tick of a built creep, without renewal
export const calculateLifetimeUpkeep = ({ body }: CalculateRenewalCost) => {
    return calculateBodyCost({ body }) / CREEP_LIFE_TIME
}