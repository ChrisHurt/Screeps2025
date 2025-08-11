import { calculateBodyCost } from "./calculateBodyCost"
import { calculateRenewalCost } from "./calculateRenewalCost"
import { calculateRenewalTicks } from "./calculateRenewalTicks"

interface CalculateRenewalCost {
    body: BodyPartConstant[]
}
// NOTE: Returns the cost per tick of renewing a creep's body parts
export const calculateRenewalEfficiency = ({ body }: CalculateRenewalCost) => {
    return calculateRenewalCost({ body }) / calculateRenewalTicks({ body })
}