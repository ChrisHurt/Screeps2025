import { expect } from 'chai'
import * as sinon from 'sinon'
import { generateContainerTasks } from '../../src/generateContainerTasks'
import { setupGlobals } from '../helpers/setupGlobals'

describe('generateContainerTasks', () => {
  let mockRoom: any
  let mockRoomMemory: any
  let pathFinderStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()
    
    pathFinderStub = sinon.stub()
    // @ts-ignore
    global.PathFinder = { search: pathFinderStub }

    mockRoom = {
      name: 'W1N1',
      find: sinon.stub(),
      createConstructionSite: sinon.stub().returns(0)
    }

    mockRoomMemory = {
      tasks: {
        harvest: [
          {
            sourceId: 'src1',
            roomName: 'W1N1',
            availablePositions: [{ x: 10, y: 10, roomName: 'W1N1' }]
          }
        ],
        upgrade: {
          controllerId: 'ctrl1',
          roomName: 'W1N1',
          availablePositions: [{ x: 20, y: 20, roomName: 'W1N1' }]
        },
        build: []
      },
      structures: undefined
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return early if roomMemory.tasks is undefined', () => {
    const roomMemoryWithoutTasks = { ...mockRoomMemory, tasks: undefined }
    
    generateContainerTasks({
      room: mockRoom,
      roomMemory: roomMemoryWithoutTasks
    })

    expect(mockRoom.find.called).to.be.false
  })

  it('should return early if no harvest tasks exist', () => {
    const roomMemoryWithoutHarvest = {
      ...mockRoomMemory,
      tasks: { ...mockRoomMemory.tasks, harvest: [] }
    }
    
    generateContainerTasks({
      room: mockRoom,
      roomMemory: roomMemoryWithoutHarvest
    })

    expect(mockRoom.find.called).to.be.false
  })

  it('should return early if no upgrade task exists', () => {
    const roomMemoryWithoutUpgrade = {
      ...mockRoomMemory,
      tasks: { ...mockRoomMemory.tasks, upgrade: undefined }
    }
    
    generateContainerTasks({
      room: mockRoom,
      roomMemory: roomMemoryWithoutUpgrade
    })

    expect(mockRoom.find.called).to.be.false
  })

  it('should return early and log error if no spawn found', () => {
    const consoleStub = sinon.stub(console, 'log')
    mockRoom.find.returns([])
    
    generateContainerTasks({
      room: mockRoom,
      roomMemory: mockRoomMemory
    })

    expect(consoleStub.calledWith('GenerateContainerTasks: No spawn found in room W1N1')).to.be.true
    expect(pathFinderStub.called).to.be.false
  })

  it('should generate container tasks for sources and controller', () => {
    const mockSpawn = { pos: { x: 25, y: 25, roomName: 'W1N1' } }
    mockRoom.find.returns([mockSpawn])
    
    const mockPath = [
      { x: 25, y: 25, roomName: 'W1N1' },
      { x: 20, y: 20, roomName: 'W1N1' },
      { x: 10, y: 10, roomName: 'W1N1' }
    ]
    
    pathFinderStub.returns({ 
      path: mockPath,
      incomplete: false 
    })

    generateContainerTasks({
      room: mockRoom,
      roomMemory: mockRoomMemory,
      roadsOnPlains: true,
      roadsOnSwamps: true
    })

    // Should call PathFinder twice - once for harvest task, once for upgrade task
    expect(pathFinderStub.calledTwice).to.be.true
    
    // Check that PathFinder was called with correct parameters
    const firstCall = pathFinderStub.getCall(0)
    expect(firstCall.args[0]).to.deep.equal(mockSpawn.pos)
    expect(firstCall.args[2]).to.deep.equal({ plainCost: 1, swampCost: 1 })
    
    // Should create construction sites
    expect(mockRoom.createConstructionSite.calledTwice).to.be.true
    
    // Should populate roomMemory.structures
    expect(mockRoomMemory.structures).to.exist
    expect(mockRoomMemory.structures.containers).to.exist
    expect(mockRoomMemory.structures.containers.sources).to.exist
    expect(mockRoomMemory.structures.containers.sources.src1).to.exist
    expect(mockRoomMemory.structures.containers.controller).to.exist
    
    // Should add build tasks
    expect(mockRoomMemory.tasks.build.length).to.equal(2)
  })

  it('should use default costs when road options are not provided', () => {
    const mockSpawn = { pos: { x: 25, y: 25, roomName: 'W1N1' } }
    mockRoom.find.returns([mockSpawn])
    
    pathFinderStub.returns({ 
      path: [{ x: 10, y: 10, roomName: 'W1N1' }],
      incomplete: false 
    })

    generateContainerTasks({
      room: mockRoom,
      roomMemory: mockRoomMemory
    })

    const firstCall = pathFinderStub.getCall(0)
    expect(firstCall.args[2]).to.deep.equal({ plainCost: 2, swampCost: 5 })
  })

  it('should handle incomplete path for harvest task and log error', () => {
    const consoleStub = sinon.stub(console, 'log')
    const mockSpawn = { pos: { x: 25, y: 25, roomName: 'W1N1' } }
    mockRoom.find.returns([mockSpawn])
    
    pathFinderStub.onFirstCall().returns({ 
      path: [{ x: 10, y: 10, roomName: 'W1N1' }],
      incomplete: true 
    })
    pathFinderStub.onSecondCall().returns({ 
      path: [{ x: 20, y: 20, roomName: 'W1N1' }],
      incomplete: false 
    })

    generateContainerTasks({
      room: mockRoom,
      roomMemory: mockRoomMemory
    })

    expect(consoleStub.calledWith('GenerateContainerTasks: Incomplete path for source src1 in room W1N1')).to.be.true
    // Should still continue with controller container
    expect(mockRoomMemory.structures.containers.controller).to.exist
  })

  it('should return early and log error if controller path is incomplete', () => {
    const consoleStub = sinon.stub(console, 'log')
    const mockSpawn = { pos: { x: 25, y: 25, roomName: 'W1N1' } }
    mockRoom.find.returns([mockSpawn])
    
    pathFinderStub.onFirstCall().returns({ 
      path: [{ x: 10, y: 10, roomName: 'W1N1' }],
      incomplete: false 
    })
    pathFinderStub.onSecondCall().returns({ 
      path: [],
      incomplete: true 
    })

    generateContainerTasks({
      room: mockRoom,
      roomMemory: mockRoomMemory
    })

    expect(consoleStub.calledWith('GenerateContainerTasks: Incomplete path for controller ctrl1 in room W1N1')).to.be.true
    expect(mockRoomMemory.structures.containers.controller).to.be.undefined
  })

  it('should handle multiple harvest tasks', () => {
    const mockSpawn = { pos: { x: 25, y: 25, roomName: 'W1N1' } }
    mockRoom.find.returns([mockSpawn])
    
    const roomMemoryWithMultipleHarvest = {
      ...mockRoomMemory,
      tasks: {
        ...mockRoomMemory.tasks,
        harvest: [
          {
            sourceId: 'src1',
            roomName: 'W1N1',
            availablePositions: [{ x: 10, y: 10, roomName: 'W1N1' }]
          },
          {
            sourceId: 'src2',
            roomName: 'W1N1',
            availablePositions: [{ x: 15, y: 15, roomName: 'W1N1' }]
          }
        ]
      }
    }
    
    pathFinderStub.returns({ 
      path: [{ x: 10, y: 10, roomName: 'W1N1' }],
      incomplete: false 
    })

    generateContainerTasks({
      room: mockRoom,
      roomMemory: roomMemoryWithMultipleHarvest
    })

    // Should call PathFinder 3 times - 2 for harvest tasks, 1 for upgrade task
    expect(pathFinderStub.calledThrice).to.be.true
    
    // Should have 3 build tasks (2 source containers + 1 controller container)
    expect(roomMemoryWithMultipleHarvest.tasks.build.length).to.equal(3)
    
    // Should have both source containers in structures
    expect(roomMemoryWithMultipleHarvest.structures.containers.sources.src1).to.exist
    expect(roomMemoryWithMultipleHarvest.structures.containers.sources.src2).to.exist
  })

  it('should initialize structures if undefined', () => {
    const mockSpawn = { pos: { x: 25, y: 25, roomName: 'W1N1' } }
    mockRoom.find.returns([mockSpawn])
    
    pathFinderStub.returns({ 
      path: [{ x: 10, y: 10, roomName: 'W1N1' }],
      incomplete: false 
    })

    // Start with undefined structures
    mockRoomMemory.structures = undefined

    generateContainerTasks({
      room: mockRoom,
      roomMemory: mockRoomMemory
    })

    expect(mockRoomMemory.structures).to.exist
    expect(mockRoomMemory.structures.containers).to.exist
    expect(mockRoomMemory.structures.containers.sources).to.exist
  })
})
