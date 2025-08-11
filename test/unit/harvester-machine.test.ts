import { HarvesterContext, HarvesterEventType, HarvesterMachine, HarvesterState, createHarvesterMachine } from '../../src/stateMachines/harvester-machine'
import { interpret, Service } from 'robot3'
import { expect } from 'chai'
import { setupGlobals } from '../helpers/setupGlobals'
import { SharedCreepState } from 'types'

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

    it('should transition to harvesting on startHarvest and clear idleStarted', () => {
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.stopHarvest })
        service.send({ type: HarvesterEventType.startHarvest })
        expect(service.machine.current).to.equal('harvesting')
        expect(context).to.be.eql({ energy: 0, capacity: 50 })
        expect(context.idleStarted).to.be.undefined
    })

    it('should transition to depositing when full', () => {
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.full })
        expect(service.machine.current).to.equal('depositing')
    })

    it('should not set idleStarted when transitioning to harvesting', () => {
        // @ts-ignore
        global.Game = { time: 1234 }
        service.send({ type: HarvesterEventType.startHarvest })
        expect(service.machine.current).to.equal('harvesting')
        expect(context.idleStarted).to.be.undefined
    })

    it('should not set idleStarted when transitioning to depositing', () => {
        // @ts-ignore
        global.Game = { time: 4321 }
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.full })
        expect(service.machine.current).to.equal('depositing')
        expect(context.idleStarted).to.be.undefined
    })

    it('should return to idle after deposited and idleStarted should be set', () => {
        // @ts-ignore
        global.Game = { time: 5678 }
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.full })
        service.send({ type: HarvesterEventType.deposited })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.equal(5678)
    })

    it('should return to idle from harvesting on stopHarvest and idleStarted should be set', () => {
        // @ts-ignore
        global.Game = { time: 9999 }
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.stopHarvest })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.equal(9999)
    })

    it('should clear idleStarted when transitioning from idle to harvesting', () => {
        // @ts-ignore
        global.Game = { time: 2222 }
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.stopHarvest })
        expect(service.context.idleStarted).to.equal(2222)
        service.send({ type: HarvesterEventType.startHarvest })
        expect(service.context.idleStarted).to.be.undefined
    })

    it('should remain in idle if receiving deposited event in idle', () => {
        // @ts-ignore
        global.Game = { time: 8888 }
        service.send({ type: HarvesterEventType.deposited })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.be.undefined
    })

    it('should remain in harvesting if receiving startHarvest event in harvesting', () => {
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.startHarvest })
        expect(service.machine.current).to.equal('harvesting')
    })

    it('should remain in depositing if receiving full event in depositing', () => {
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.full })
        service.send({ type: HarvesterEventType.full })
        expect(service.machine.current).to.equal('depositing')
    })

  it('should return to idle after deposited and idleStarted should be set', () => {
    // Simulate Game.time for setIdleTick
    // @ts-ignore
    global.Game = { time: 5678 }
    service.send({ type: HarvesterEventType.startHarvest })
    service.send({ type: HarvesterEventType.full })
    service.send({ type: HarvesterEventType.deposited })
    expect(service.machine.current).to.equal('idle')
    // @ts-ignore
    expect(service.context.idleStarted).to.equal(5678)
  })

  it('should return to idle from harvesting on stopHarvest and idleStarted should be set', () => {
    // @ts-ignore
    global.Game = { time: 9999 }
    service.send({ type: HarvesterEventType.startHarvest })
    service.send({ type: HarvesterEventType.stopHarvest })
    expect(service.machine.current).to.equal('idle')
    expect(service.context.idleStarted).to.equal(9999)
  })

    it('should keep energy/capacity unchanged after transitions', () => {
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.full })
        service.send({ type: HarvesterEventType.deposited })
        expect(service.context.energy).to.equal(0)
        expect(service.context.capacity).to.equal(50)
    })

    it('should not set idleStarted if Game.time is undefined', () => {
        // @ts-ignore
        delete global.Game.time
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.stopHarvest })
        expect(service.context.idleStarted).to.be.undefined
    })

    it('should handle multiple deposited events in depositing', () => {
        // @ts-ignore
        global.Game = { time: 123 }
        service.send({ type: HarvesterEventType.startHarvest })
        service.send({ type: HarvesterEventType.full })
        service.send({ type: HarvesterEventType.deposited })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.equal(123)
        // @ts-ignore
        global.Game = { time: 456 }
        service.send({ type: HarvesterEventType.deposited })
        expect(service.machine.current).to.equal('idle')
        // idleStarted should not update again
        expect(service.context.idleStarted).to.equal(123)
    })

    it('should not update idleStarted if already set and receiving deposited in idle', () => {
        // @ts-ignore
        global.Game = { time: 789 }
        context.idleStarted = 555
        service.send({ type: HarvesterEventType.deposited })
        expect(service.machine.current).to.equal('idle')
        expect(service.context.idleStarted).to.equal(555)
    })

    it('should allow starting in harvesting state', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createHarvesterMachine(() => context, HarvesterState.harvesting),()=>{})
        expect(service.machine.current).to.equal('harvesting')
        service.send({ type: HarvesterEventType.full })
        expect(service.machine.current).to.equal('depositing')
    })

    it('should allow starting in depositing state', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createHarvesterMachine(() => context, HarvesterState.depositing),()=>{})
        expect(service.machine.current).to.equal('depositing')
        service.send({ type: HarvesterEventType.deposited })
        expect(service.machine.current).to.equal('idle')
    })

    it('should default to idle if initialState is not provided', () => {
        context = { energy: 0, capacity: 50 }
        service = interpret(createHarvesterMachine(() => context),()=>{})
        expect(service.machine.current).to.equal('idle')
    })
})
