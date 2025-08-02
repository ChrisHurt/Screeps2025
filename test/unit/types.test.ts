import { describe, it } from 'mocha'
import { expect } from 'chai'
import * as types from '../../src/types'

describe('types', () => {
  it('should export Position type', () => {
    const pos: types.Position = { x: 1, y: 2 }
    expect(pos).to.deep.equal({ x: 1, y: 2 })
  })

  it('should export QueuePriority enum', () => {
    expect(types.QueuePriority.LOW).to.equal(0)
    expect(types.QueuePriority.MEDIUM).to.equal(1)
    expect(types.QueuePriority.HIGH).to.equal(2)
  })

  it('should allow creating a HarvestTask', () => {
    const task: types.RoomHarvestTask = {
      availablePositions: [new RoomPosition(1, 3, 'W1N1')],
      sourceId: 'src',
      sourcePosition: new RoomPosition(1, 2, 'W1N1'),
      roomName: 'W1N1',
      requiredWorkParts: 2,
      reservingCreeps: {},
    }
    expect(task.sourceId).to.equal('src')
  })
})
