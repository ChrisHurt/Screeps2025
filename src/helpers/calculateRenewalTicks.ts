interface CalculateRenewalCost {
    body: BodyPartConstant[]
}

export const calculateRenewalTicks = ({ body }: CalculateRenewalCost) => {
    return Math.floor(600/body.length)
}