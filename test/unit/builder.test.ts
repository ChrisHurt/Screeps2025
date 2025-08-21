import { expect } from 'chai'
import * as sinon from 'sinon'
import { runBuilderCreep, processCurrentBuilderState } from '../../src/creepProcessors/builder'
import { SharedCreepState } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('builder processor', () => {
  let mockCreep: any
  let mockBuilderService: any
  let mockRoom: any
  let interpretStub: sinon.SinonStub
  let recycleStub: sinon.SinonStub
  let collectEnergyStub: sinon.SinonStub
  let buildStub: sinon.SinonStub

  beforeEach(() => {
    setupGlobals()

    mockRoom = {
      find: sinon.stub().returns([]),
      findClosestByPath: sinon.stub().returns(null)
    }

    mockCreep = {
      memory: {
        state: SharedCreepState.idle,
        idleStarted: undefined
      },
      store: {
        getUsedCapacity: sinon.stub().returns(0),
        getCapacity: sinon.stub().returns(100),
        [RESOURCE_ENERGY]: 0
      },
      room: mockRoom,
      say: sinon.stub(),
      suicide: sinon.stub(),
      pos: {
        findClosestByPath: sinon.stub().returns(null)
      }
    }

    mockBuilderService = {
      context: {
        energy: 0,
        capacity: 100,
        idleStarted: undefined
      },
      machine: {
        current: SharedCreepState.idle
      },
      send: sinon.stub()
    }

    // Mock dependencies
    interpretStub = sinon.stub().returns(mockBuilderService)
    // @ts-ignore
    global.interpret = interpretStub

    recycleStub = sinon.stub().returns({ continue: false, state: SharedCreepState.recycling })
    collectEnergyStub = sinon.stub().returns({ continue: false, state: SharedCreepState.collectingEnergy })
    buildStub = sinon.stub().returns({ continue: false, state: SharedCreepState.building })
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('runBuilderCreep', () => {
    it('should initialize with idle state if no state in memory', () => {
      mockCreep.memory.state = undefined
      // Mock no construction sites so it stays idle
      mockRoom.find.returns([])
      // Mock Game.time not set so idleStarted doesn't get set
      // @ts-ignore
      global.Game = { time: undefined }

      runBuilderCreep(mockCreep)

      expect(mockCreep.memory.state).to.equal(SharedCreepState.idle)
      expect(mockCreep.say.called).to.be.true
    })

    it('should use existing idle state from memory', () => {
      mockCreep.memory.state = SharedCreepState.idle
      mockBuilderService.machine.current = SharedCreepState.idle
      // Mock no construction sites so it stays idle
      mockRoom.find.returns([])
      // Mock Game.time not set so idleStarted doesn't get set
      // @ts-ignore
      global.Game = { time: undefined }

      runBuilderCreep(mockCreep)

      expect(mockCreep.memory.state).to.equal(SharedCreepState.idle)
    })

    it('should set creep speech emoji based on final state', () => {
      mockCreep.memory.state = SharedCreepState.recycling
      mockBuilderService.machine.current = SharedCreepState.recycling

      runBuilderCreep(mockCreep)

      expect(mockCreep.say.calledWith('💀', false)).to.be.true
    })
  })

  describe('processCurrentBuilderState', () => {
    it('should handle idle state with available construction sites', () => {
      mockRoom.find.returns([{ id: 'site1' }])
      mockBuilderService.machine.current = SharedCreepState.idle

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(mockBuilderService.send.calledWith({ type: 'buildTarget' })).to.be.true
      expect(result).to.deep.equal({
        continue: true,
        state: SharedCreepState.building
      })
    })

    it('should handle idle state with no construction sites and no idle timeout', () => {
      mockRoom.find.returns([])
      mockBuilderService.machine.current = SharedCreepState.idle
      mockCreep.memory.idleStarted = undefined

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(result).to.deep.equal({
        continue: false,
        state: SharedCreepState.idle
      })
    })

    it('should recycle if idle too long', () => {
      // @ts-ignore
      global.Game = { time: 100 }
      
      mockRoom.find.returns([])
      mockBuilderService.machine.current = SharedCreepState.idle
      mockCreep.memory.idleStarted = 40 // 100 - 40 = 60 > 50

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(mockBuilderService.send.calledWith({ type: SharedCreepState.recycling })).to.be.true
      expect(result).to.deep.equal({
        continue: true,
        state: SharedCreepState.recycling
      })
    })

    it('should not recycle if idle time is within threshold', () => {
      // @ts-ignore
      global.Game = { time: 100 }
      
      mockRoom.find.returns([])
      mockBuilderService.machine.current = SharedCreepState.idle
      mockCreep.memory.idleStarted = 60 // 100 - 60 = 40 < 50

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(mockBuilderService.send.calledWith({ type: SharedCreepState.recycling })).to.be.false
      expect(result).to.deep.equal({
        continue: false,
        state: SharedCreepState.idle
      })
    })

    it('should handle unknown state gracefully', () => {
      const consoleStub = sinon.stub(console, 'log')
      mockBuilderService.machine.current = 'unknownState'

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(consoleStub.calledWith('Unknown builder state: unknownState')).to.be.true
      expect(result).to.deep.equal({
        continue: false,
        state: SharedCreepState.idle
      })
    })

    it('should handle error state', () => {
      mockBuilderService.machine.current = SharedCreepState.error

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(result).to.deep.equal({
        continue: false,
        state: SharedCreepState.idle
      })
    })
  })
})
