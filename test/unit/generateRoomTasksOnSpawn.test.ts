import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { generateRoomTasksOnSpawn } from '../../src/generateRoomTasksOnSpawn'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'

describe('generateRoomTasksOnSpawn', () => {
    const mockController = { id: 'ctrl1', pos: { x: 10, y: 10, roomName: 'W1N1' } }
    const mockSource = { id: 'src1', pos: { x: 5, y: 5, roomName: 'W1N1' }, energyCapacity: 3000 } as Source
    const mockMineral = { mineralType: 'H', density: 1000, pos: { x: 15, y: 15, roomName: 'W1N1' } } as Mineral
    const mockRoom = {
        mineral: mockMineral,
        controller: mockController,
        find: (type: number) => {
          if (type === FIND_SOURCES) {
            return [mockSource]
          }
          if (type === FIND_MINERALS) {
            return [mockMineral]
          }
          return []
        },
        name: 'W1N1',
        getTerrain: () =>({
            get: (x: number, y: number) => {
                // Mock terrain data
                return (x === 10 && y === 10) ? 1 : (x === 5 && y === 5) ? 0 : 2; // 1 for wall, 0 for plain, 2 for swamp
            }
        })
    } as unknown as Room
  beforeEach(() => {
    setupGlobals()
    // @ts-ignore
    global.Memory.rooms = {}
  })

  it('should not throw or set memory if room is not in Game.rooms', () => {
    expect(() => generateRoomTasksOnSpawn('W1N1')).to.not.throw()
    expect(Memory.rooms['W1N1']).to.be.undefined
  })

  it('should log an error if room is not in Game.rooms', () => {
    const logSpy = sinon.spy(console, 'log')
    generateRoomTasksOnSpawn('W1N1')
    expect(logSpy.calledWithMatch(/GenerateRoomTasksError/)).to.be.true
    logSpy.restore()
  })

  it('should not set memory if controller is missing', () => {
    Game.rooms['W1N1'] = { controller: undefined } as Room
    expect(() => generateRoomTasksOnSpawn('W1N1')).to.not.throw()
    expect(Memory.rooms['W1N1']).to.be.undefined
  })

  it('should set up tasks and memory for a room with sources and controller', () => {
    Game.rooms['W1N1'] = mockRoom
    generateRoomTasksOnSpawn('W1N1')
    const mem = Memory.rooms['W1N1']
    expect(mem).to.exist
    expect(mem.tasks).to.exist
    expect(mem.tasks?.upgrade).to.exist
    expect(mem.tasks?.harvest).to.have.length(1)
    expect(mem.sources?.src1.energyGenerationPerTick).to.equal(10)
    expect(mem.sources?.src1.position).to.deep.equal({ x: 5, y: 5, roomName: 'W1N1' })
    expect(mem.totalEnergyGenerationPerTick).to.equal(10)
  })

  it('should correctly set memory of source energyGenerationPerTickCycle to 10 when first spawning in a room', () => {
    Game.rooms['W1N1'] = {
      ...mockRoom,
      find: (type: number) => {
        if (type === FIND_SOURCES) {
          return [{ ...mockSource, energyCapacity: 1500 }] // Mock source with energyCapacity of 1500
        }
        return []
      }
    }
    generateRoomTasksOnSpawn('W1N1')
    const mem = Memory.rooms['W1N1']
    expect(mem.sources?.src1.energyGenerationPerTick).to.equal(10)
    expect(mem.sources?.src1.position).to.deep.equal({ x: 5, y: 5, roomName: 'W1N1' })
    expect(mem.totalEnergyGenerationPerTick).to.equal(10)
  })

  it('should correctly set memory of source energyGenerationPerTickCycle in central room', () => {
    Game.rooms['W1N1'] = {
      ...mockRoom,
      find: (type: number) => {
        if (type === FIND_SOURCES) {
          return [{ ...mockSource, energyCapacity: 4000 }] // Mock source with energyCapacity of 4000
        }
        return []
      }
    }
    generateRoomTasksOnSpawn('W1N1')
    const mem = Memory.rooms['W1N1']
    const centreRoomSourceEnergyGeneration = 4000/300
    expect(mem.sources?.src1.energyGenerationPerTick).to.equal(centreRoomSourceEnergyGeneration)
    expect(mem.sources?.src1.position).to.deep.equal({ x: 5, y: 5, roomName: 'W1N1' })
    expect(mem.totalEnergyGenerationPerTick).to.equal(centreRoomSourceEnergyGeneration)
  })

  it('should set mineral memory if mineral is present', () => {
    Game.rooms['W1N1'] = mockRoom
    generateRoomTasksOnSpawn('W1N1')
    const mem = Memory.rooms['W1N1']
    expect(mem.mineral).to.exist
    expect(mem.mineral?.type).to.equal('H')
    expect(mem.mineral?.density).to.equal(1000)
    expect(mem.mineral?.position).to.deep.equal({ x: 15, y: 15, roomName: 'W1N1' })
    expect(mem.mineral?.mineralGenerationPerTick).to.equal(1)
  })

  it('should leave mineral memory unset if no mineral is present', () => {
    Game.rooms['W1N1'] = {
      ...mockRoom,
      find: (type: number) => {
        if (type === FIND_SOURCES) {
          return [mockSource]
        }
        return []
      }
    }
    generateRoomTasksOnSpawn('W1N1')
    const mem = Memory.rooms['W1N1']
    expect(mem.mineral).to.not.exist
  })
})
