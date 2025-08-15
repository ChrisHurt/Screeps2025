import { createGuardMachine, GuardContext, GuardEventType, GuardMachine, GuardState } from '../../src/stateMachines/guard-machine'
import { SharedCreepEventType, SharedCreepState } from 'types'
import { interpret, Service } from 'robot3'
import { expect } from 'chai'
import { setupGlobals } from '../helpers/setupGlobals'

describe('Guard State Machine', () => {
    let service: Service<GuardMachine>
    let context: GuardContext
    beforeEach(() => {
        setupGlobals()
        context = {}
        service = interpret(createGuardMachine(() => context), () => {})
    })

    it('should start in idle state', () => {
        expect(service.machine.current).to.equal(SharedCreepState.idle)
    })

    it('should start in attacking state', () => {
    service = interpret(createGuardMachine(() => context, GuardState.attacking), () => {})
        expect(service.machine.current).to.equal(GuardState.attacking)
    })

    it('should transition to attacking on hostilesEngaged', () => {
        service.send({ type: GuardEventType.hostilesEngaged })
        expect(service.machine.current).to.equal(GuardState.attacking)
    })

    it('should transition to recycling on recycleSelf', () => {
        service.send({ type: SharedCreepEventType.recycleSelf })
        expect(service.machine.current).to.equal(SharedCreepState.recycling)
    })

    it('should transition to idle on hostilesNeutralised', () => {
    service = interpret(createGuardMachine(() => context, GuardState.attacking), () => {})
        service.send({ type: GuardEventType.hostilesNeutralised })
        expect(service.machine.current).to.equal(SharedCreepState.idle)
    })

    it('should transition to recycling on retreatOrdered', () => {
    service = interpret(createGuardMachine(() => context, GuardState.attacking), () => {})
        service.send({ type: GuardEventType.retreatOrdered })
        expect(service.machine.current).to.equal(SharedCreepState.recycling)
    })
})
