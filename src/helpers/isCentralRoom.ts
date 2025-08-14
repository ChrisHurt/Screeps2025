const centralRoomOrdinateOrAbscissa = new Set([4, 5, 6])

export function isCentralRoom(roomName: string): boolean {
  if (!/^([EW]\d+[NS]\d+)$/.test(roomName)) return false

  const ordinateIndex = roomName.indexOf('N') !== -1 ? roomName.indexOf('N') : roomName.indexOf('S')

  const x = parseInt(roomName.slice(1, ordinateIndex), 10)
  const y = parseInt(roomName.slice(ordinateIndex + 1), 10)

  return centralRoomOrdinateOrAbscissa.has(x) && centralRoomOrdinateOrAbscissa.has(y)
}