interface CalculateRenewalCost {
    body: BodyPartConstant[]
}

export const BODYPART_COST: { [part: string]: number } = {
    attack: 80,
    carry: 50,
    claim: 600,
    heal: 250,
    move: 50,
    ranged_attack: 150,
    tough: 10,
    work: 100,
}

export const calculateBodyCost = ({ body }: CalculateRenewalCost) => {
    return body.reduce((total, part) => total + BODYPART_COST[part], 0);
}