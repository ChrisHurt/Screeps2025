import { deleteCreepFromMemory } from "memory/deleteCreepFromMemory"
import { deleteStructureFromMemory } from "memory/deleteStructureFromMemory"
import { StructureName } from "types"

export const deleteUnusedMemory = () => {
  const creepNamesInMemory = Object.keys(Memory.creeps)
  const creepNamesObserved = Object.keys(Game.creeps)

  const {
    unbuiltContainersObserved,
    unbuiltRoadNamesObserved,
    unbuiltStructureNamesObserved
  } = Object.values(Game.constructionSites).reduce<{
    unbuiltContainersObserved: StructureName[],
    unbuiltRoadNamesObserved: StructureName[],
    unbuiltStructureNamesObserved: StructureName[]
  }>((accum, site) => {
    const structureName: StructureName = `${site.structureType}_${site.room?.name}:${site.pos.x},${site.pos.y}`
    if (site.structureType === STRUCTURE_CONTAINER) {
      accum.unbuiltContainersObserved.push(structureName)
    } else if (site.structureType === STRUCTURE_ROAD) {
      accum.unbuiltRoadNamesObserved.push(structureName)
    } else {
      accum.unbuiltStructureNamesObserved.push(structureName)
    }
    return accum
  },{ unbuiltContainersObserved: [], unbuiltRoadNamesObserved: [], unbuiltStructureNamesObserved: [] })

  const structureNamesInMemory: StructureName[] = (Object.keys(Memory.structures) as StructureName[]).filter(structureName => {
    const structure = Memory.structures[structureName]
    return structure && structure.type !== STRUCTURE_CONTAINER && structure.type !== STRUCTURE_ROAD
  })
  const builtStructureNamesObserved =
    Object.values(Game.structures)
    .filter(s => s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_ROAD)
    .map(s => `${s.structureType}_${s.room.name}:${s.pos.x},${s.pos.y}`)
  const structureNamesObserved: StructureName[] = [...builtStructureNamesObserved, ...unbuiltStructureNamesObserved] as StructureName[]

  // TODO: Extract the following from Game.structures since
  // containers & roads are visible in Game.structures for owned rooms
  const { containersObserved, roadsObserved } = Object.values(Game.rooms).reduce<{
    containersObserved: Set<StructureName>
    roadsObserved: Set<StructureName>
  }>((acc, room) => {

    const structures = room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_ROAD 
    })

    structures.forEach(structure => {
      if (structure.pos) {
        const structureName: StructureName = `${structure.structureType}_${room.name}:${structure.pos.x},${structure.pos.y}`
        if (structure.structureType === STRUCTURE_CONTAINER) {
          acc.containersObserved.add(structureName)
        } else if (structure.structureType === STRUCTURE_ROAD) {
          acc.roadsObserved.add(structureName)
        }
      }
    })

    return acc
  }, { containersObserved: new Set<StructureName>(), roadsObserved: new Set<StructureName>() })

  const containerNamesInMemory: StructureName[] = structureNamesInMemory.filter(name => name.startsWith(STRUCTURE_CONTAINER))
  const roadNamesInMemory: StructureName[] = structureNamesInMemory.filter(name => name.startsWith(STRUCTURE_ROAD))

  // Delete memory for any creep that's not in the living creeps list
  for (const creepName of creepNamesInMemory) {
    if (!creepNamesObserved.includes(creepName)) {
      deleteCreepFromMemory(creepName)
    }
  }

  // Clean up memory for structures that no longer exist (excluding containers and roads which have separate logic)
  for (const structureName of structureNamesInMemory) {
    if (!structureNamesObserved.includes(structureName)) {
      console.log(`DeleteMemory: Removing structure ${structureName} - not observed`)
      deleteStructureFromMemory(structureName)
    }
  }

  unbuiltContainersObserved.forEach(containerName=> containersObserved.add(containerName))

  // Clean up memory for containers that are in observable rooms, and do not exist
  for (const containerName of containerNamesInMemory) {
    const roomName = Memory.structures[containerName]?.roomName || ''
    if (!containersObserved.has(containerName) && roomName in Game.rooms) {
      console.log(`DeleteMemory: Removing container ${containerName} from room ${roomName} - not observed but room is visible`)
      deleteStructureFromMemory(containerName as StructureName)
    }
  }

  unbuiltRoadNamesObserved.forEach(roadName=> roadsObserved.add(roadName))

  // Clean up memory for roads that are in observable rooms, and do not exist
  for (const roadName of roadNamesInMemory) {
    const roomName = Memory.structures[roadName]?.roomName || ''
    if (!roadsObserved.has(roadName) && roomName in Game.rooms) {
      console.log(`DeleteMemory: Removing road ${roadName} from room ${roomName} - not observed but room is visible`)
      deleteStructureFromMemory(roadName as StructureName)
    }
  }
}