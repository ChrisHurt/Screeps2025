import { expect } from 'chai'
import sinon from 'sinon'
import { assignNextBuildTask } from '../../src/helpers/assignNextBuildTask'

describe('assignNextBuildTask', () => {
  let mockCreep: any
  
  beforeEach(() => {
    // Reset global Memory
    // @ts-ignore
    global.Memory = {
      rooms: {}
    }
    
    mockCreep = {
      name: 'TestBuilder',
      memory: {},
      room: {
        name: 'W1N1'
      }
    }
  })

  afterEach(() => {
    if (sinon && sinon.restore) {
      sinon.restore()
    }
  })

  it('should assign the first build task from room memory', () => {
    // Setup room memory with build tasks
    // @ts-ignore
    Memory.rooms['W1N1'] = {
      tasks: {
        build: [
          {
            buildParams: {
              position: { x: 10, y: 10, roomName: 'W1N1' } as any,
              repairDuringSiege: true,
              path: [{ x: 9, y: 9, roomName: 'W1N1' }] as any,
              structureType: 'extension' as any
            },
            roomName: 'W1N1',
            reservingCreeps: {}
          },
          {
            buildParams: {
              position: { x: 20, y: 20, roomName: 'W1N1' } as any,
              repairDuringSiege: false,
              path: [{ x: 19, y: 19, roomName: 'W1N1' }] as any,
              structureType: 'road' as any
            },
            roomName: 'W1N1',
            reservingCreeps: {}
          }
        ],
        harvest: []
      }
    }

    const result = assignNextBuildTask(mockCreep)

    expect(result).to.be.true
    expect(mockCreep.memory.task).to.deep.equal({
      position: { x: 10, y: 10, roomName: 'W1N1' },
      repairDuringSiege: true,
      path: [{ x: 9, y: 9, roomName: 'W1N1' }],
      taskId: 'W1N1-build',
      type: 'build'
    })
  })

  it('should return false if no build tasks are available', () => {
    // Setup room memory with no build tasks
    // @ts-ignore
    Memory.rooms['W1N1'] = {
      tasks: {
        build: [],
        harvest: []
      }
    }

    const result = assignNextBuildTask(mockCreep)

    expect(result).to.be.false
    expect(mockCreep.memory.task).to.be.undefined
  })

  it('should return false if room memory does not exist', () => {
    // No room memory setup
    
    const result = assignNextBuildTask(mockCreep)

    expect(result).to.be.false
    expect(mockCreep.memory.task).to.be.undefined
  })

  it('should return false if creep has no room', () => {
    mockCreep.room = undefined

    const result = assignNextBuildTask(mockCreep)

    expect(result).to.be.false
    expect(mockCreep.memory.task).to.be.undefined
  })

  it('should return false if tasks property does not exist in room memory', () => {
    // @ts-ignore
    Memory.rooms['W1N1'] = {}

    const result = assignNextBuildTask(mockCreep)

    expect(result).to.be.false
    expect(mockCreep.memory.task).to.be.undefined
  })

  it('should return false if first build task is null', () => {
    // Setup room memory with null as first task
    // @ts-ignore
    Memory.rooms['W1N1'] = {
      tasks: {
        build: [null as any], // Null task to trigger line 26
        harvest: []
      }
    }

    const result = assignNextBuildTask(mockCreep)

    expect(result).to.be.false
    expect(mockCreep.memory.task).to.be.undefined
  })

  it('should return false if first build task is undefined', () => {
    // Setup room memory with undefined as first task
    // @ts-ignore
    Memory.rooms['W1N1'] = {
      tasks: {
        build: [undefined as any], // Undefined task to trigger line 26
        harvest: []
      }
    }

    const result = assignNextBuildTask(mockCreep)

    expect(result).to.be.false
    expect(mockCreep.memory.task).to.be.undefined
  })
})
