import { UpgraderContext, UpgraderMachine, createUpgraderMachine } from '../../src/stateMachines/upgrader-machine'
import { interpret, Service } from 'robot3'
import { expect } from 'chai'
import { setupGlobals } from '../helpers/setupGlobals'
import { SharedCreepEventType, SharedCreepState } from 'types'

describe('upgraderMachine', () => {
    let service: Service<UpgraderMachine>
    let context: UpgraderContext
    beforeEach(() => {
        setupGlobals()
        context = { energy: 0, capacity: 50 }
        service = interpret(createUpgraderMachine(() => context, SharedCreepState.idle), () => {})
    })

    it('should start in idle state and idleStarted should be undefined', () => {
        expect(service.machine.current).to.equal('idle')
        expect(context).to.be.eql({ energy: 0, capacity: 50 })
        expect(context.idleStarted).to.be.undefined
    })

    it('should transition to collecting on startCollecting and clear idleStarted', () => {
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('collectingEnergy')
        expect(context.idleStarted).to.be.undefined
    })

    it('should transition to upgrading when collected', () => {
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('upgrading')
    })

    it('should return to collecting after empty and idleStarted should be set', () => {
        // @ts-ignore
        global.Game = { time: 5678 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('collectingEnergy')
        expect(service.context.idleStarted).to.equal(5678)
    })

    it('should return to idle from collecting on idle event and idleStarted should be set', () => {
        // @ts-ignore
        global.Game = { time: 9999 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.idle })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.equal(9999)
    })

    it('should clear idleStarted when transitioning from idle to collecting', () => {
        // @ts-ignore
        global.Game = { time: 2222 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.idle })
        expect(service.context.idleStarted).to.equal(2222)
        service.send({ type: SharedCreepEventType.empty })
        expect(service.context.idleStarted).to.be.undefined
    })

    it('should remain in idle if receiving collected event in idle', () => {
        // @ts-ignore
        global.Game = { time: 8888 }
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.be.undefined
    })

    it('should remain in collecting if receiving startCollecting event in collecting', () => {
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('collectingEnergy')
    })

    it('should remain in upgrading if receiving collected event in upgrading', () => {
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('upgrading')
    })

    it('should allow starting in collecting state', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createUpgraderMachine(() => context, SharedCreepState.collectingEnergy),()=>{})
        expect(service.machine.current).to.equal('collectingEnergy')
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('upgrading')
    })

    it('should allow starting in upgrading state', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createUpgraderMachine(() => context, SharedCreepState.upgrading),()=>{})
        expect(service.machine.current).to.equal('upgrading')
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('collectingEnergy')
    })

    it('should default to idle if initialState is not provided', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createUpgraderMachine(() => context),()=>{})
        expect(service.machine.current).to.equal('idle')
    })
})
