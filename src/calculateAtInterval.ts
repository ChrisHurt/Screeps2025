interface CalculationAtIntervalInput {
    interval: number
    calculation: () => void
}

export const calculateAtTickInterval = ({
    interval,
    calculation
}: CalculationAtIntervalInput): void => {
    if (Game.time % interval === 0) {
        calculation()
    }
}
