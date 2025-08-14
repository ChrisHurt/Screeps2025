
import { SharedCreepState } from "types"

interface RecycleOutput {
    continue: boolean
    state: SharedCreepState.recycling
}

export const recycle = (creep: Creep): RecycleOutput => {
    const spawnRecycler = creep.room.find(FIND_MY_SPAWNS)[0]

    if (!spawnRecycler) {
        console.log(`Spawn not found for creep ${creep.name}`)
        creep.suicide()
        return { continue: false, state: SharedCreepState.recycling }
    }

    if (!creep.pos.isNearTo(spawnRecycler)) {
        creep.moveTo(spawnRecycler.pos.x, spawnRecycler.pos.y, { reusePath: 5, visualizePathStyle: { stroke: '#fff' } })
    }

    if (creep.pos.inRangeTo(spawnRecycler, 1)) {
        creep.transfer(spawnRecycler, RESOURCE_ENERGY)
        if (!spawnRecycler.spawning) {
            spawnRecycler.recycleCreep(creep)
        }
    }
    return { continue: false, state: SharedCreepState.recycling }
}