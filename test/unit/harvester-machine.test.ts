import { HarvesterContext, HarvesterMachine, createHarvesterMachine } from '../../src/stateMachines/harvester-machine'
import { interpret, Service } from 'robot3'
import { expect } from 'chai'
import { setupGlobals } from '../helpers/setupGlobals'
import { SharedCreepEventType, SharedCreepState } from 'types'

describe('harvesterMachine', () => {
    let service: Service<HarvesterMachine>
    let context: HarvesterContext
    beforeEach(() => {
        setupGlobals()
        context = { energy: 0, capacity: 50 }
        service = interpret(createHarvesterMachine(() => context, SharedCreepState.idle), () => {})
    })

    it('should start in idle state and idleStarted should be undefined', () => {
        expect(service.machine.current).to.equal('idle')
        expect(context).to.be.eql({ energy: 0, capacity: 50 })
        expect(context.idleStarted).to.be.undefined
    })

    it('should transition to harvesting on empty and clear idleStarted', () => {
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('harvesting')
        expect(context).to.be.eql({ energy: 0, capacity: 50 })
        expect(context.idleStarted).to.be.undefined
    })

    it('should transition to depositing when full', () => {
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('depositingEnergy')
    })

    it('should not set idleStarted when transitioning to depositing', () => {
        // @ts-ignore
        global.Game = { time: 4321 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('depositingEnergy')
        expect(context.idleStarted).to.be.undefined
    })

    it('should return to idle after deposited and idleStarted should be set', () => {
        // @ts-ignore
        global.Game = { time: 5678 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.equal(5678)
    })

    it('should clear idleStarted when transitioning from idle to harvesting', () => {
        // @ts-ignore
        global.Game = { time: 2222 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.idle })
        expect(service.context.idleStarted).to.equal(2222)
        service.send({ type: SharedCreepEventType.empty })
        expect(service.context.idleStarted).to.be.undefined
    })

    it('should remain in harvesting if receiving empty event during harvesting', () => {
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('harvesting')
    })

    it('should remain in depositing if receiving full event in depositing', () => {
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('depositingEnergy')
    })

    it('should return to idle after deposited and idleStarted should be set', () => {
        // Simulate Game.time for setIdleTick
        // @ts-ignore
        global.Game = { time: 5678 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('idle')
        // @ts-ignore
        expect(service.context.idleStarted).to.equal(5678)
    })

    it('should return to depositing from harvesting on full and idleStarted should not be set', () => {
        // @ts-ignore
        global.Game = { time: 9999 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('depositingEnergy')
        expect(service.context.idleStarted).to.equal(undefined)
    })

    it('should keep energy/capacity unchanged after transitions', () => {
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        service.send({ type: SharedCreepEventType.empty })
        expect(service.context.energy).to.equal(0)
        expect(service.context.capacity).to.equal(50)
    })

    it('should not set idleStarted if Game.time is undefined', () => {
        // @ts-ignore
        delete global.Game.time
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        expect(service.context.idleStarted).to.be.undefined
    })

    it('should handle multiple deposited events in depositing', () => {
        // @ts-ignore
        global.Game = { time: 123 }
        service.send({ type: SharedCreepEventType.empty })
        service.send({ type: SharedCreepEventType.full })
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.equal(123)
        // @ts-ignore
        global.Game = { time: 456 }
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('harvesting')
        // idleStarted should not update again
        expect(service.context.idleStarted).to.equal(undefined)
    })

    it('should not update idleStarted if already set and receiving deposited in idle', () => {
        // @ts-ignore
        global.Game = { time: 789 }
        context.idleStarted = 555
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('harvesting')
        expect(service.context.idleStarted).to.equal(undefined)
    })

    it('should allow starting in harvesting state', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createHarvesterMachine(() => context, SharedCreepState.harvesting),()=>{})
        expect(service.machine.current).to.equal('harvesting')
        service.send({ type: SharedCreepEventType.full })
        expect(service.machine.current).to.equal('depositingEnergy')
    })

    it('should allow starting in depositing state', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createHarvesterMachine(() => context, SharedCreepState.depositingEnergy),()=>{})
        expect(service.machine.current).to.equal('depositingEnergy')
        service.send({ type: SharedCreepEventType.empty })
        expect(service.machine.current).to.equal('idle')
    })

    it('should default to idle if initialState is not provided', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createHarvesterMachine(() => context),()=>{})
        expect(service.machine.current).to.equal('idle')
    })
})
