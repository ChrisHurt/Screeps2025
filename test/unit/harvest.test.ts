import { expect } from 'chai'
import * as sinon from 'sinon'
import { harvest } from '../../src/behaviours/harvest'
import { SharedCreepEventType, SharedCreepState } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('harvest behaviour', () => {
  let mockCreep: any
  let mockService: any
  let mockCreepTask: any
  let mockContext: any
  let mockSource: any
  let mockRoom: any

  beforeEach(() => {
    setupGlobals()
    
    mockSource = {
      id: 'source1',
      pos: { x: 25, y: 25, roomName: 'W1N1' }
    }

    mockRoom = {
      find: sinon.stub().returns([mockSource])
    }

    mockCreep = {
      name: 'TestCreep',
      room: mockRoom,
      pos: {
        x: 20,
        y: 20,
        roomName: 'W1N1',
        isNearTo: sinon.stub(),
        inRangeTo: sinon.stub()
      },
      moveTo: sinon.stub(),
      harvest: sinon.stub()
    }

    mockService = {
      send: sinon.stub()
    }

    mockCreepTask = {
      sourceId: 'source1',
      sourcePosition: { x: 25, y: 25, roomName: 'W1N1' } as RoomPosition
    }

    mockContext = {
      energy: 0,
      capacity: 300
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should transition to depositing when creep is full', () => {
    mockContext.energy = 300
    mockContext.capacity = 300

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(mockService.send.calledWith({ type: SharedCreepEventType.full })).to.be.true
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.depositingEnergy
    })
  })

  it('should move to source when not near source position', () => {
    mockCreep.pos.isNearTo.returns(false)
    mockCreep.pos.inRangeTo.returns(false)

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(mockCreep.moveTo.calledWith(25, 25, {
      reusePath: 5,
      visualizePathStyle: { stroke: '#ffaa00' }
    })).to.be.true
    expect(result).to.deep.equal({
      continue: false,
      state: SharedCreepState.harvesting
    })
  })

  it('should harvest source when in range', () => {
    mockCreep.pos.isNearTo.returns(true)
    mockCreep.pos.inRangeTo.returns(true)

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(mockCreep.harvest.calledWith(mockSource)).to.be.true
    expect(result).to.deep.equal({
      continue: false,
      state: SharedCreepState.harvesting
    })
  })

  it('should harvest source without moving when near but not yet in range', () => {
    mockCreep.pos.isNearTo.returns(true)
    mockCreep.pos.inRangeTo.returns(false)

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(mockCreep.moveTo.called).to.be.false
    expect(mockCreep.harvest.called).to.be.false
    expect(result).to.deep.equal({
      continue: false,
      state: SharedCreepState.harvesting
    })
  })

  it('should transition to idle when source not found', () => {
    mockRoom.find.returns([])
    const consoleStub = sinon.stub(console, 'log')

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(consoleStub.calledWith('Source with ID source1 not found for creep TestCreep')).to.be.true
    expect(mockService.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.idle
    })
  })

  it('should handle different source ID correctly', () => {
    mockCreepTask.sourceId = 'source2'
    mockRoom.find.returns([mockSource]) // Still returns source1

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(mockService.send.calledWith({ type: SharedCreepEventType.idle })).to.be.true
    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.idle
    })
  })

  it('should handle multiple sources in room', () => {
    const mockSource2 = { id: 'source2' }
    mockRoom.find.returns([mockSource, mockSource2])
    mockCreep.pos.isNearTo.returns(true)
    mockCreep.pos.inRangeTo.returns(true)

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(mockCreep.harvest.calledWith(mockSource)).to.be.true
    expect(result).to.deep.equal({
      continue: false,
      state: SharedCreepState.harvesting
    })
  })

  it('should handle edge case where energy equals capacity', () => {
    mockContext.energy = 300
    mockContext.capacity = 300

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(result).to.deep.equal({
      continue: true,
      state: SharedCreepState.depositingEnergy
    })
  })

  it('should handle partial energy correctly', () => {
    mockContext.energy = 150
    mockContext.capacity = 300
    mockCreep.pos.isNearTo.returns(true)
    mockCreep.pos.inRangeTo.returns(true)

    const result = harvest({
      creep: mockCreep,
      creepTask: mockCreepTask,
      context: mockContext,
      service: mockService
    })

    expect(mockCreep.harvest.calledWith(mockSource)).to.be.true
    expect(result).to.deep.equal({
      continue: false,
      state: SharedCreepState.harvesting
    })
  })
})
