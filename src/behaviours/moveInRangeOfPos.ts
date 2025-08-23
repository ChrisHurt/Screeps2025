
interface MoveInRangeOfPos {
    creep: Creep
    moveParams?: {
        reusePath?: number
        visualizePathStyle?: {
            stroke: string
        }
    }
    offset: number
    target: RoomPosition
}

// NOTE: If true is returned, move successful
export const moveInRangeOfPos = ({
    creep,
    moveParams={ reusePath: 5, visualizePathStyle: { stroke: '#0000ff' } },
    offset,
    target
}: MoveInRangeOfPos): boolean => {
    if (creep.pos.inRangeTo(target, offset)) { return false }

    creep.moveTo(target.x, target.y, moveParams)
    return true
}