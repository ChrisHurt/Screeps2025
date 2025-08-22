import { CreepBuildTask, CustomRoomMemory } from "../types"

/**
 * Assigns the next available build task (index 0 is top priority) to a creep's memory.
 * Returns true if a task was successfully assigned, false if no tasks are available.
 */
export function assignNextBuildTask(creep: Creep): boolean {
    const roomName = creep.room?.name
    
    if (!roomName) {
        console.log(`assignNextBuildTask: Creep ${creep.name} has no room`)
        return false
    }
    
    const roomMemory = Memory.rooms[roomName] as CustomRoomMemory
    
    if (!roomMemory?.tasks?.build || roomMemory.tasks.build.length === 0) {
        console.log(`assignNextBuildTask: No build tasks available in room ${roomName}`)
        return false
    }
    
    // Get the next available task (index 0 is top priority)
    const nextBuildTask = roomMemory.tasks.build[0]
    
    if (!nextBuildTask) {
        return false
    }
    
    // Create the creep build task from the room build task
    const creepBuildTask: CreepBuildTask = {
        position: nextBuildTask.buildParams.position,
        repairDuringSiege: nextBuildTask.buildParams.repairDuringSiege,
        path: nextBuildTask.buildParams.path,
        taskId: `${nextBuildTask.roomName}-build`,
        type: "build"
    }
    
    // Assign the task to the creep's memory
    const creepMemory = creep.memory as any
    creepMemory.task = creepBuildTask
    
    console.log(`assignNextBuildTask: Assigned build task to creep ${creep.name} at position ${creepBuildTask.position.x},${creepBuildTask.position.y} in room ${roomName}`)
    
    return true
}
