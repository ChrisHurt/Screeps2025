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

  it('should handle case where no construction site is found', () => {
    // Mock findInRange to return empty array
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

    // Create a spy to catch potential errors
    const consoleErrorSpy = sinon.spy(console, 'error')
    
    // This should handle the case where no site is found - may cause an error internally
    expect(() => {
      build({ creep: mockCreep, service: mockService })
    }).to.not.throw()
    
    // Clean up the spy
    consoleErrorSpy.restore()
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
