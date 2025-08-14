import { checkIfUnused } from 'behaviours/sharedCreepBehaviours/checkIfUnused'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { SharedCreepEventType } from 'types'

describe('checkIfUnused', () => {
  let creep: Creep
  let service: any
  let context: any

  beforeEach(() => {
    // @ts-ignore
    global.Game = { time: 200 }
    creep = { name: 'TestCreep' } as Creep
    service = { send: sinon.spy() }
    context = { idleStarted: Game.time - 100 }
  })

  it('should recycle creep if idle time exceeds threshold', () => {
    const result = checkIfUnused({ creep, context, service, threshold: 50 })
    expect(result).to.be.true
    expect(service.send.calledOnce).to.be.true
    expect(service.send.firstCall.args[0]).to.deep.equal({ type: SharedCreepEventType.recycleSelf })
  })

  it('should not recycle creep if idle time is below threshold', () => {
    context.idleStarted = Game.time - 10
    const result = checkIfUnused({ creep, context, service, threshold: 50 })
    expect(result).to.be.false
    expect(service.send.notCalled).to.be.true
  })

  it('should use default threshold if not provided', () => {
    context.idleStarted = Game.time - 51
    const result = checkIfUnused({ creep, context, service })
    expect(result).to.be.true
    expect(service.send.calledOnce).to.be.true
  })

  it('should handle undefined idleStarted as 0', () => {
    context.idleStarted = undefined
    const result = checkIfUnused({ creep, context, service, threshold: 50 })
    expect(result).to.be.false
    expect(service.send.notCalled).to.be.true
  })
})
