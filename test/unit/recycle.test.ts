import { recycle } from 'behaviours/sharedCreepBehaviours/recycle'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { SharedCreepState } from 'types'
import { setupGlobals } from '../helpers/setupGlobals'

describe('recycle', () => {
  let creep: any
  let spawn: any

  beforeEach(() => {
    setupGlobals()
    spawn = {
      pos: { x: 10, y: 20 },
      spawning: null,
      recycleCreep: sinon.spy(),
      transfer: sinon.spy()
    }
    creep = {
      name: 'TestCreep',
      room: { find: sinon.stub().returns([spawn]) },
      pos: {
        isNearTo: sinon.stub().returns(true),
        inRangeTo: sinon.stub().returns(true),
        x: 10,
        y: 20
      },
      moveTo: sinon.spy(),
      transfer: sinon.spy(),
      suicide: sinon.spy()
    }
  })

  it('should move creep to spawn if not near', () => {
    creep.pos.isNearTo.returns(false)
    creep.pos.inRangeTo.returns(false)
    creep.moveTo = sinon.spy()
    const result = recycle(creep)
    expect(creep.moveTo.calledWith(spawn.pos.x, spawn.pos.y)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.recycling })
  })

  it('should transfer energy and recycle creep if in range', () => {
    creep.pos.inRangeTo.returns(true)
    spawn.spawning = null
    spawn.recycleCreep = sinon.spy()
    creep.transfer = sinon.spy()
    const result = recycle(creep)
    expect(creep.transfer.calledWith(spawn, RESOURCE_ENERGY)).to.be.true
    expect(spawn.recycleCreep.calledWith(creep)).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.recycling })
  })

  it('should not recycle creep if spawn is spawning', () => {
    creep.pos.inRangeTo.returns(true)
    spawn.spawning = true
    spawn.recycleCreep = sinon.spy()
    creep.transfer = sinon.spy()
    const result = recycle(creep)
    expect(creep.transfer.calledWith(spawn, RESOURCE_ENERGY)).to.be.true
    expect(spawn.recycleCreep.notCalled).to.be.true
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.recycling })
  })

  it('should log if no spawn found', () => {
    creep.room.find.returns([])
    const consoleSpy = sinon.spy(console, 'log')
    const result = recycle(creep)
    expect(consoleSpy.calledWithMatch(/Spawn not found/)).to.be.true
    consoleSpy.restore()
    expect(result).to.deep.equal({ continue: false, state: SharedCreepState.recycling })
  })
})
