export const evaluateRoom = (roomName: string) => {
  const room = Game.rooms[roomName]
  if (!room) {
    console.log(`EvaluateRoomError: Cannot evaluate room not in Game.rooms: ${roomName}`)
    return
  }

  // Internal Evaluation: Independent of connections
  // - Check resource generation potential
  // - Check for threats in the room
  // - Check how easily the room can be defended


  // If all connections are evaluated, proceed with External Evaluation
  // External Evaluation: Dependent on connections
  // - Check internal evaluation of connected rooms
  // - Evaluate potential for remote gathering
}