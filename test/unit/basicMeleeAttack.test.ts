import { basicMeleeAttack } from '../../src/behaviours/sharedCreepBehaviours/basicMeleeAttack'
import { GuardEventType, GuardState } from '../../src/stateMachines/guard-machine'
import { SharedCreepState } from 'types'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { setupGlobals } from '../helpers/setupGlobals'

describe('basicMeleeAttack', () => {
    let creep: any, service: any
    beforeEach(() => {
        setupGlobals()
        creep = {
            body: [{ type: TOUGH, hits: 100 }, { type: ATTACK, hits: 100 }, { type: MOVE, hits: 100 }],
            room: {
                find: sinon.stub()
            },
            pos: {
                findClosestByRange: sinon.stub(),
                getRangeTo: sinon.stub()
            },
            moveTo: sinon.stub(),
            attack: sinon.stub()
        }
        service = { send: sinon.stub() }
    })

    it('should move to nearest hostile if not in range', () => {
        const hostile = { hits: 100, pos: { getRangeTo: () => 2 } }
        creep.room.find.returns([hostile])
        creep.pos.findClosestByRange.returns(hostile)
        creep.pos.getRangeTo.returns(2)
        const result = basicMeleeAttack({ creep, service })
        expect(creep.moveTo.calledWith(hostile)).to.be.true
        expect(result.state).to.equal(GuardState.attacking)
        expect(result.continue).to.be.false
    })

    it('should attack weakest hostile in range', () => {
        const hostile1 = { hits: 100, pos: { getRangeTo: () => 1 } }
        const hostile2 = { hits: 50, pos: { getRangeTo: () => 1 } }
        const hostile3 = { hits: 75, pos: { getRangeTo: () => 1 } }
        creep.room.find.returns([hostile1, hostile2, hostile3])
        creep.pos.findClosestByRange.returns(hostile1)
        creep.pos.getRangeTo.returns(1)
        const result = basicMeleeAttack({ creep, service })
        expect(creep.attack.calledWith(hostile2)).to.be.true
        expect(result.state).to.equal(GuardState.attacking)
        expect(result.continue).to.be.false
    })

    it('should send hostilesNeutralised and return idle if no hostiles remain', () => {
        creep.room.find.onCall(0).returns([])
        creep.room.find.onCall(1).returns([])
        const result = basicMeleeAttack({ creep, service })
        expect(service.send.calledWith({ type: GuardEventType.hostilesNeutralised })).to.be.true
        expect(result.state).to.equal(SharedCreepState.idle)
        expect(result.continue).to.be.true
    })

    it('should not move or attack if no hostiles', () => {
        creep.room.find.returns([])
        const result = basicMeleeAttack({ creep, service })
        expect(creep.moveTo.called).to.be.false
        expect(creep.attack.called).to.be.false
        expect(service.send.calledWith({ type: GuardEventType.hostilesNeutralised })).to.be.true
        expect(result.state).to.equal(SharedCreepState.idle)
        expect(result.continue).to.be.true
    })

    it('should retreat and recycle if creep has no attack parts', () => {
        creep.body = [{ type: TOUGH, hits: 100 }, { type: MOVE, hits: 100 }]
        const result = basicMeleeAttack({ creep, service })
        expect(service.send.calledWith({ type: GuardEventType.retreatOrdered })).to.be.true
        expect(result.state).to.equal(SharedCreepState.recycling)
        expect(result.continue).to.be.true
    })
})
