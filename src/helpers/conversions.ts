import { Position, ROOM_SIZE } from "types"

export const convertPositionToTerrainIndex = ({
    x,
    y,
}: Position | RoomPosition): number => {
    return (y) * ROOM_SIZE + x
}

export const convertTerrainIndexToPosition = (index: number): Position => ({
  x: (index % ROOM_SIZE),
  y: Math.floor(index / ROOM_SIZE)
})