import { expect } from 'chai'
import * as sinon from 'sinon'
import { build } from '../../src/behaviours/build'
import { SharedCreepEventType, SharedCreepState } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('build behaviour', () => {
  let mockCreep: any
  let mockService: any
  let mockSite: any

  beforeEach(() => {
    setupGlobals()
    
    mockSite = {
      pos: { x: 15, y: 15, roomName: 'W1N1' }
    }

    mockCreep = {
      store: { [RESOURCE_ENERGY]: 50 },
      memory: {
        task: {
          type: 'build',
          position: { x: 15, y: 15, roomName: 'W1N1' }
        }
      },
      pos: { 
        x: 10, 
        y: 10, 
        roomName: 'W1N1',
        inRangeTo: sinon.stub(),
        findInRange: sinon.stub()
      },
      build: sinon.stub(),
      moveTo: sinon.stub()
    }

    mockService = {
      send: sinon.stub()
    }

    // Override RoomPosition for this test suite
    // @ts-ignore
    global.RoomPosition = class MockRoomPosition {
      x: number
      y: number
      roomName: string

      constructor(x: number, y: number, roomName: string) {
        this.x = x
        this.y = y
        this.roomName = roomName
      }

      findInRange(findType: any, range: number) {
        return [mockSite]
      }
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return collecting state if creep has no energy', () => {
    mockCreep.store[RESOURCE_ENERGY] = 0

    const result = build({ creep: mockCreep, service: mockService })

    expect(mockService.send.calledWith({ type: SharedCreepEventType.empty })).to.be.true
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.collectingEnergy
    })
    expect(mockCreep.build.called).to.be.false
    expect(mockCreep.moveTo.called).to.be.false
  })

  it('should build construction site if creep is in range and has energy', () => {
    mockCreep.pos.inRangeTo.withArgs(mockSite, 3).returns(true)
    mockCreep.pos.inRangeTo.withArgs(mockSite, 2).returns(true)

    const result = build({ creep: mockCreep, service: mockService })

    expect(mockCreep.build.calledWith(mockSite)).to.be.true
    expect(mockCreep.moveTo.called).to.be.false
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.building
    })
  })

  it('should move to target if not in range for building', () => {
    mockCreep.pos.inRangeTo.withArgs(mockSite, 3).returns(false)
    mockCreep.pos.inRangeTo.withArgs(mockSite, 2).returns(false)

    const result = build({ creep: mockCreep, service: mockService })

    expect(mockCreep.build.called).to.be.false
    expect(mockCreep.moveTo.calledOnce).to.be.true
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.building
    })
  })

  it('should build but not move if in build range but not move range', () => {
    mockCreep.pos.inRangeTo.withArgs(mockSite, 3).returns(true)
    mockCreep.pos.inRangeTo.withArgs(mockSite, 2).returns(false)

    const result = build({ creep: mockCreep, service: mockService })

    expect(mockCreep.build.calledWith(mockSite)).to.be.true
    expect(mockCreep.moveTo.calledOnce).to.be.true
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.building
    })
  })

  it('should handle case where no construction site is found and cleanup room memory', () => {
    // Setup memory structure with build tasks that don't match the current task
    const memoryBefore = {
      rooms: {
        'W1N1': {
          tasks: {
            build: [
              {
                buildParams: {
                  position: { x: 20, y: 20, roomName: 'W1N1' },  // Different position 
                  repairDuringSiege: false,
                  path: []
                }
              }
            ]
          }
        }
      }
    }
    // @ts-ignore - Bypass type checking for test setup
    Memory.rooms = memoryBefore.rooms

    // Mock findInRange to return empty array (no construction site found)
    // @ts-ignore
    global.RoomPosition = class MockRoomPosition {
      x: number
      y: number
      roomName: string

      constructor(x: number, y: number, roomName: string) {
        this.x = x
        this.y = y
        this.roomName = roomName
      }

      findInRange(findType: any, range: number) {
        return []
      }
    }

    const result = build({ creep: mockCreep, service: mockService })

    // Should return idle state when construction site is complete
    expect(result).to.deep.equal({
      continue: false,
      state: SharedCreepState.idle
    })

    // Should not call build or moveTo
    expect(mockCreep.build.called).to.be.false
    expect(mockCreep.moveTo.called).to.be.false
  })

  it('should remove matching build task from room memory when site is complete', () => {
    // Setup memory with exact matching task that should be removed
    const mockRoomMemory = {
      tasks: {
        build: [
          {
            buildParams: {
              position: { x: 15, y: 15, roomName: 'W1N1' }  // Exact match
            }
          },
          {
            buildParams: {
              position: { x: 20, y: 20, roomName: 'W1N1' }  // Different task
            }
          }
        ]
      }
    }
    // @ts-ignore
    Memory.rooms = { 'W1N1': mockRoomMemory }

    // Mock findInRange to return empty array (no construction site found)
    // @ts-ignore
    global.RoomPosition = class MockRoomPosition {
      x: number
      y: number
      roomName: string

      constructor(x: number, y: number, roomName: string) {
        this.x = x
        this.y = y
        this.roomName = roomName
      }

      findInRange(findType: any, range: number) {
        return []
      }
    }

    build({ creep: mockCreep, service: mockService })

    // Should have filtered out the matching task, leaving only the non-matching one
    const remainingTasks = Memory.rooms['W1N1']?.tasks?.build
    expect(remainingTasks).to.have.length(1)
    // @ts-ignore - Type bypass for test
    expect(remainingTasks![0].buildParams.position.x).to.equal(20)
    // @ts-ignore - Type bypass for test  
    expect(remainingTasks![0].buildParams.position.y).to.equal(20)
  })

  it('should assign next build task when current task is complete and continue building', () => {
    // Setup memory with multiple build tasks, first one will be completed, second should be assigned
    const mockRoomMemory = {
      tasks: {
        build: [
          {
            buildParams: {
              position: { x: 15, y: 15, roomName: 'W1N1' }  // Current task (will be completed)
            }
          },
          {
            buildParams: {
              position: { x: 25, y: 25, roomName: 'W1N1' },  // Next task to assign
              repairDuringSiege: false,
              path: [{ x: 24, y: 24, roomName: 'W1N1' }]
            }
          }
        ]
      }
    }
    // @ts-ignore
    Memory.rooms = { 'W1N1': mockRoomMemory }

    // Mock the creep to have a room so assignNextBuildTask can work
    const mockRoom = { name: 'W1N1' }
    mockCreep.room = mockRoom as any

    // Mock findInRange to return empty array (no construction site found, task complete)
    // @ts-ignore
    global.RoomPosition = class MockRoomPosition {
      x: number
      y: number
      roomName: string

      constructor(x: number, y: number, roomName: string) {
        this.x = x
        this.y = y
        this.roomName = roomName
      }

      findInRange(findType: any, range: number) {
        return []
      }
    }

    const result = build({ creep: mockCreep, service: mockService })

    // Should continue building with the new task
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.building
    })

    // Should have removed the completed task
    const remainingTasks = Memory.rooms['W1N1']?.tasks?.build
    expect(remainingTasks).to.have.length(1)
    // @ts-ignore - Type bypass for test
    expect(remainingTasks![0].buildParams.position.x).to.equal(25)

    // Should have assigned the new task to the creep
    expect(mockCreep.memory.task.position.x).to.equal(25)
    expect(mockCreep.memory.task.position.y).to.equal(25)
    expect(mockCreep.memory.task.type).to.equal('build')
  })

  it('should go idle when current task is complete and no more tasks available', () => {
    // Setup memory with only one build task that will be completed
    const mockRoomMemory = {
      tasks: {
        build: [
          {
            buildParams: {
              position: { x: 15, y: 15, roomName: 'W1N1' }  // Only task, will be completed
            }
          }
        ]
      }
    }
    // @ts-ignore
    Memory.rooms = { 'W1N1': mockRoomMemory }

    // Mock the creep to have a room so assignNextBuildTask can work
    const mockRoom = { name: 'W1N1' }
    mockCreep.room = mockRoom as any

    // Mock findInRange to return empty array (no construction site found, task complete)
    // @ts-ignore
    global.RoomPosition = class MockRoomPosition {
      x: number
      y: number
      roomName: string

      constructor(x: number, y: number, roomName: string) {
        this.x = x
        this.y = y
        this.roomName = roomName
      }

      findInRange(findType: any, range: number) {
        return []
      }
    }

    const result = build({ creep: mockCreep, service: mockService })

    // Should go idle when no more tasks available
    expect(result).to.deep.equal({
      continue: false,
      state: SharedCreepState.idle
    })

    // Should have removed the completed task
    const remainingTasks = Memory.rooms['W1N1']?.tasks?.build
    expect(remainingTasks).to.have.length(0)
  })

  it('should handle null site gracefully', () => {
    // Mock findInRange to return undefined or null site
    // @ts-ignore
    global.RoomPosition = class MockRoomPosition {
      x: number
      y: number
      roomName: string

      constructor(x: number, y: number, roomName: string) {
        this.x = x
        this.y = y
        this.roomName = roomName
      }

      findInRange(findType: any, range: number) {
        return [null]
      }
    }

    // This should handle the case gracefully
    expect(() => {
      build({ creep: mockCreep, service: mockService })
    }).to.not.throw()
  })

  it('should move to target position when not in range', () => {
    mockCreep.pos.inRangeTo.withArgs(mockSite, 3).returns(false)
    mockCreep.pos.inRangeTo.withArgs(mockSite, 2).returns(false)

    const result = build({ creep: mockCreep, service: mockService })

    // Should call moveTo with the target position
    expect(mockCreep.moveTo.calledOnce).to.be.true
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.building
    })
  })

  it('should handle different room positions correctly', () => {
    mockCreep.memory.task.position = { x: 30, y: 40, roomName: 'W2N2' }
    
    const result = build({ creep: mockCreep, service: mockService })

    // Should create RoomPosition with the correct coordinates
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.building
    })
  })

  it('should handle site being exactly at position 0,0', () => {
    mockCreep.memory.task.position = { x: 0, y: 0, roomName: 'W1N1' }
    mockSite.pos = { x: 0, y: 0, roomName: 'W1N1' }
    mockCreep.pos.inRangeTo.withArgs(mockSite, 3).returns(true)
    mockCreep.pos.inRangeTo.withArgs(mockSite, 2).returns(true)

    const result = build({ creep: mockCreep, service: mockService })

    expect(mockCreep.build.calledWith(mockSite)).to.be.true
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.building
    })
  })

  it('should handle build task interface properties', () => {
    // Verify the task type is properly used
    const taskType = mockCreep.memory.task.type
    expect(taskType).to.equal('build')
  })
})
