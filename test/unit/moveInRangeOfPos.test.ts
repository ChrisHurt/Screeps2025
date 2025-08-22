import { expect } from 'chai'
import * as sinon from 'sinon'
import { moveInRangeOfPos } from '../../src/behaviours/sharedCreepBehaviours/moveInRangeOfPos'
import { setupGlobals } from '../helpers/setupGlobals'

describe('moveInRangeOfPos', () => {
  let mockCreep: any
  let mockTarget: any

  beforeEach(() => {
    setupGlobals()
    
    mockTarget = {
      x: 25,
      y: 25,
      roomName: 'W1N1'
    } as RoomPosition

    mockCreep = {
      pos: {
        x: 20,
        y: 20,
        roomName: 'W1N1',
        inRangeTo: sinon.stub()
      },
      moveTo: sinon.stub()
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return false when creep is already in range', () => {
    mockCreep.pos.inRangeTo.withArgs(mockTarget, 3).returns(true)

    const result = moveInRangeOfPos({
      creep: mockCreep,
      offset: 3,
      target: mockTarget
    })

    expect(result).to.be.false
    expect(mockCreep.moveTo.called).to.be.false
  })

  it('should return true and move when creep is not in range', () => {
    mockCreep.pos.inRangeTo.withArgs(mockTarget, 3).returns(false)

    const result = moveInRangeOfPos({
      creep: mockCreep,
      offset: 3,
      target: mockTarget
    })

    expect(result).to.be.true
    expect(mockCreep.moveTo.calledWith(25, 25, {
      reusePath: 5,
      visualizePathStyle: { stroke: '#0000ff' }
    })).to.be.true
  })

  it('should use custom moveParams when provided', () => {
    mockCreep.pos.inRangeTo.withArgs(mockTarget, 2).returns(false)
    const customMoveParams = {
      reusePath: 10,
      visualizePathStyle: { stroke: '#ff0000' }
    }

    const result = moveInRangeOfPos({
      creep: mockCreep,
      moveParams: customMoveParams,
      offset: 2,
      target: mockTarget
    })

    expect(result).to.be.true
    expect(mockCreep.moveTo.calledWith(25, 25, customMoveParams)).to.be.true
  })

  it('should handle offset of 1 correctly', () => {
    mockCreep.pos.inRangeTo.withArgs(mockTarget, 1).returns(false)

    const result = moveInRangeOfPos({
      creep: mockCreep,
      offset: 1,
      target: mockTarget
    })

    expect(result).to.be.true
    expect(mockCreep.moveTo.called).to.be.true
  })

  it('should handle offset of 0 correctly', () => {
    mockCreep.pos.inRangeTo.withArgs(mockTarget, 0).returns(true)

    const result = moveInRangeOfPos({
      creep: mockCreep,
      offset: 0,
      target: mockTarget
    })

    expect(result).to.be.false
    expect(mockCreep.moveTo.called).to.be.false
  })

  it('should handle different target positions', () => {
    const differentTarget = { x: 10, y: 15, roomName: 'W2N2' } as RoomPosition
    mockCreep.pos.inRangeTo.withArgs(differentTarget, 5).returns(false)

    const result = moveInRangeOfPos({
      creep: mockCreep,
      offset: 5,
      target: differentTarget
    })

    expect(result).to.be.true
    expect(mockCreep.moveTo.calledWith(10, 15)).to.be.true
  })

  it('should handle large offset values', () => {
    mockCreep.pos.inRangeTo.withArgs(mockTarget, 10).returns(true)

    const result = moveInRangeOfPos({
      creep: mockCreep,
      offset: 10,
      target: mockTarget
    })

    expect(result).to.be.false
    expect(mockCreep.moveTo.called).to.be.false
  })

  it('should work without moveParams (using default)', () => {
    mockCreep.pos.inRangeTo.withArgs(mockTarget, 1).returns(false)

    const result = moveInRangeOfPos({
      creep: mockCreep,
      offset: 1,
      target: mockTarget
    })

    expect(result).to.be.true
    expect(mockCreep.moveTo.calledWith(25, 25, {
      reusePath: 5,
      visualizePathStyle: { stroke: '#0000ff' }
    })).to.be.true
  })
})
