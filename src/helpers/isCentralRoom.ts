const centralRoomOrdinateOrAbscissa = new Set([4, 5, 6])

export function isCentralRoom(roomName: string): boolean {
  if (!/^([EW]\d+[NS]\d+)$/.test(roomName)) return false

  const abscissaCardinal = roomName[0]
  const ordinateIndex = roomName.indexOf('N') !== -1 ? roomName.indexOf('N') : roomName.indexOf('S')
  if ((abscissaCardinal !== 'E' && abscissaCardinal !== 'W') || ordinateIndex === -1) return false

  const x = parseInt(roomName.slice(1, ordinateIndex), 10)
  const y = parseInt(roomName.slice(ordinateIndex + 1), 10)
  if (isNaN(x) || isNaN(y)) return false

  return centralRoomOrdinateOrAbscissa.has(x) && centralRoomOrdinateOrAbscissa.has(y)
}