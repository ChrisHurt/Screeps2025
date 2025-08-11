import { calculateBodyCost } from "./calculateBodyCost";

interface CalculateRenewalCost {
    body: BodyPartConstant[]
}

export const calculateRenewalCost = ({ body }: CalculateRenewalCost) => {
    const bodyCost = calculateBodyCost({ body })

    return Math.ceil(bodyCost / 2.5 / body.length)
}