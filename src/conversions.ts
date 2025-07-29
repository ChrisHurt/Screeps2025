import { Position } from "types"

export const convertPositionToTerrainIndex = ({
    x,
    y,
}: Position | RoomPosition): number => {
    return (y-1) * 25 + x - 1
}

export const convertTerrainIndexToPosition = (index: number): Position => ({
  x: (index % 25) + 1,
  y: Math.floor(index / 25) + 1
})