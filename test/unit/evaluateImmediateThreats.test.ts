import { evaluateImmediateThreats } from '../../src/evaluateImmediateThreats'
import { expect } from 'chai'
import { setupGlobals } from '../helpers/setupGlobals'
import * as sinon from 'sinon'

describe('evaluateImmediateThreats', () => {

    let roomFind: sinon.SinonStub

    beforeEach(() => {
        setupGlobals()
        roomFind = sinon.stub()
        roomFind.callsFake((type: number) => {
            if (type === FIND_HOSTILE_CREEPS) return [{ id: 'c1' }, { id: 'c2' }]
            if (type === FIND_HOSTILE_POWER_CREEPS) return [{ id: 'p1' }]
            if (type === FIND_HOSTILE_STRUCTURES) return [{ id: 's1' }, { id: 's2' }]
            return []
        })
        const roomStub = {
            name: 'W1N1',
            find: roomFind,
        }
        global.Game.rooms = { W1N1: roomStub as unknown as Room }
    })

    it('should update Memory.rooms with threat info for each room', () => {
        global.Game.time = 100
        Memory.rooms = { W1N1: { effectiveEnergyPerTick: 0, totalSourceEnergyPerTick: 0 } }
        evaluateImmediateThreats()
        expect(Memory.rooms.W1N1.threats).to.deep.equal({
            enemyCreepCount: 2,
            enemyPowerCreepCount: 1,
            enemyStructures: ['s1', 's2'],
            lastObserved: 100
        })
    })

    it('should not update threats if lastObserved is recent (<5 ticks ago)', () => {
        global.Game.time = 105
        Memory.rooms = { W1N1: { threats: {
            lastObserved: 103,
            enemyCreepCount: 99,
            enemyPowerCreepCount: 99,
            enemyStructures: ['old']
        }} as RoomMemory }
        evaluateImmediateThreats()
        expect(Memory.rooms.W1N1?.threats?.lastObserved).to.equal(103)
    })

    it('should handle missing Memory.rooms entry gracefully', () => {
        global.Game.time = 200
        Memory.rooms = {}
        evaluateImmediateThreats()
    })

    it('should handle missing threats property in Memory.rooms', () => {
        global.Game.time = 300
        Memory.rooms = { W1N1: { effectiveEnergyPerTick: 0, totalSourceEnergyPerTick: 0 } }
        evaluateImmediateThreats()
        expect(Memory.rooms.W1N1.threats).to.deep.equal({
            enemyCreepCount: 2,
            enemyPowerCreepCount: 1,
            enemyStructures: ['s1', 's2'],
            lastObserved: 300
        })
    })
})
