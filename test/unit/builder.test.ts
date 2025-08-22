import { expect } from 'chai'
import * as sinon from 'sinon'
import { runBuilderCreep, processCurrentBuilderState } from '../../src/creepProcessors/builder'
import { SharedCreepState } from '../../src/types'
import { setupGlobals } from '../helpers/setupGlobals'
import * as buildBehavior from '../../src/behaviours/build'
import * as recycleBehavior from '../../src/behaviours/sharedCreepBehaviours/recycle'
import * as collectEnergyBehavior from '../../src/behaviours/upgraderBehaviours/collectEnergy'

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

    buildStub = sinon.stub(buildBehavior, 'build').returns({ continue: false, state: SharedCreepState.building })
    recycleStub = sinon.stub(recycleBehavior, 'recycle').returns({ continue: false, state: SharedCreepState.recycling })
    collectEnergyStub = sinon.stub(collectEnergyBehavior, 'collectEnergy').returns({ continue: false, state: SharedCreepState.collectingEnergy })
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

    it('should handle infinite loop protection with permittedIterations', () => {
      mockCreep.memory.state = SharedCreepState.idle
      mockBuilderService.machine.current = SharedCreepState.idle
      
      // Mock room with construction sites to trigger continue: true
      mockRoom.find.returns([{ id: 'site1' }])
      
      // Mock processCurrentBuilderState to always return continue: true
      let callCount = 0
      buildStub.callsFake(() => {
        callCount++
        return { continue: true, state: SharedCreepState.building }
      })
      
      runBuilderCreep(mockCreep)
      
      // Should only run 10 iterations then stop due to permittedIterations limit
      expect(callCount).to.equal(10)
      expect(mockCreep.memory.state).to.equal(SharedCreepState.building)
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

    it('should call build behavior for building state', () => {
      mockBuilderService.machine.current = SharedCreepState.building

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(buildStub.calledWith({
        creep: mockCreep,
        service: mockBuilderService
      })).to.be.true
      expect(result).to.deep.equal({
        continue: false,
        state: SharedCreepState.building
      })
    })

    it('should call collectEnergy behavior for collectingEnergy state', () => {
      mockBuilderService.machine.current = SharedCreepState.collectingEnergy
      mockCreep.store[RESOURCE_ENERGY] = 25
      mockCreep.store.getCapacity.returns(100)

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(collectEnergyStub.calledWith({
        creep: mockCreep,
        context: {
          energy: 25,
          capacity: 100,
          idleStarted: undefined
        },
        service: mockBuilderService
      })).to.be.true
      expect(result).to.deep.equal({
        continue: false,
        state: SharedCreepState.collectingEnergy
      })
    })

    it('should call recycle behavior for recycling state', () => {
      mockBuilderService.machine.current = SharedCreepState.recycling

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(recycleStub.calledWith(mockCreep)).to.be.true
      expect(result).to.deep.equal({
        continue: false,
        state: SharedCreepState.recycling
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

    it('should handle processCurrentBuilderState with actual unknown state logging', () => {
      const consoleStub = sinon.stub(console, 'log')
      mockBuilderService.machine.current = 'completely_unknown_state'

      const result = processCurrentBuilderState(mockCreep, mockBuilderService)

      expect(consoleStub.calledWith('Unknown builder state: completely_unknown_state')).to.be.true
      expect(result).to.deep.equal({
        continue: false,
        state: SharedCreepState.idle
      })
      
      consoleStub.restore()
    })
  })
})
