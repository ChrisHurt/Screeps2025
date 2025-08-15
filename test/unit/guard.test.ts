
import { expect } from 'chai'
import * as sinon from 'sinon'
import { SharedCreepState } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'
import rewiremock from 'rewiremock/node'

const basicMeleeAttack = sinon.stub()
const checkIfUnused = sinon.stub()
const recycle = sinon.stub()

rewiremock('../../src/behaviours/sharedCreepBehaviours/basicMeleeAttack').with({ basicMeleeAttack })
rewiremock('../../src/behaviours/sharedCreepBehaviours/checkIfUnused').with({ checkIfUnused })
rewiremock('../../src/behaviours/sharedCreepBehaviours/recycle').with({ recycle })

let runGuardCreep: typeof import('../../src/creepProcessors/guard').runGuardCreep

rewiremock.enable()
runGuardCreep = require('creepProcessors/guard').runGuardCreep
rewiremock.disable()

describe('runGuardCreep', () => {
  let creep: any

  before(() => {
    setupGlobals()
  })

  beforeEach(() => {
    creep = {
      memory: { state: SharedCreepState.idle, role: 'GUARD' },
      body: [
        { type: 'tough', hits: 100 },
        { type: 'attack', hits: 100 },
        { type: 'move', hits: 100 }
      ],
      room: { find: sinon.stub().returns([{ hits: 50, pos: { getRangeTo: () => 1 } }]) },
      pos: { findClosestByRange: sinon.stub().returns({ hits: 50 }), getRangeTo: sinon.stub().returns(1) },
      say: sinon.stub()
    }
    checkIfUnused.returns(false)
    basicMeleeAttack.returns({ continue: false, state: SharedCreepState.idle })
    recycle.returns({ continue: false, state: SharedCreepState.recycling })
  })

  afterEach(() => {
    basicMeleeAttack.resetHistory()
    checkIfUnused.resetHistory()
    recycle.resetHistory()
  })

    it('should return idle when no hostiles and checkIfUnused returns false', () => {
      creep.memory.state = SharedCreepState.idle
      creep.room.find.returns([])
      creep.pos.findClosestByRange.returns(undefined)
      checkIfUnused.returns(false)
      // Directly test processCurrentGuardState for coverage
      const guardService = { machine: { current: SharedCreepState.idle }, context: {} } as any
      const result = require('../../src/creepProcessors/guard').processCurrentGuardState(creep, guardService)
      expect(result).to.deep.equal({ continue: false, state: SharedCreepState.idle })
    })

  it('should call basicMeleeAttack in attacking state', () => {
    creep.memory.state = 'attacking'
    runGuardCreep(creep)
    expect(basicMeleeAttack.called).to.be.true
  })

  it('should call recycle if in recycling state', () => {
    creep.memory.state = SharedCreepState.recycling
    runGuardCreep(creep)
    expect(creep.memory.state).to.equal(SharedCreepState.recycling)
    expect(recycle.called).to.be.true
  })

  it('should call recycle if checkIfUnused returns true', () => {
    checkIfUnused.returns(true)
    // Ensure no hostiles are present
    creep.room.find.returns([])
    creep.pos.findClosestByRange.returns(undefined)
    runGuardCreep(creep)
    expect(creep.memory.state).to.equal(SharedCreepState.recycling)
    // Call again to process recycling state
    runGuardCreep(creep)
    expect(recycle.called).to.be.true
  })

  it('should call basicMeleeAttack if hostiles present and has attack parts', () => {
    creep.memory.state = SharedCreepState.idle
    creep.room.find.returns([{ hits: 50, pos: { getRangeTo: () => 1 } }])
    creep.pos.findClosestByRange.returns({ hits: 50 })
    runGuardCreep(creep)
    // Call again to process attacking state
    runGuardCreep(creep)
    expect(basicMeleeAttack.called).to.be.true
  })

  it('should handle creep without initial state without crashing', () => {
    delete creep.memory.state
    runGuardCreep(creep)
  })
})
