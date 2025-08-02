import { describe, it } from 'mocha';
import { expect } from 'chai';
import * as types from '../../src/types';

describe('types', () => {
  it('should export Position type', () => {
    const pos: types.Position = { x: 1, y: 2 };
    expect(pos).to.deep.equal({ x: 1, y: 2 });
  });

  it('should export QueuePriority enum', () => {
    expect(types.QueuePriority.LOW).to.equal(0);
    expect(types.QueuePriority.MEDIUM).to.equal(1);
    expect(types.QueuePriority.HIGH).to.equal(2);
  });

  it('should allow creating a HarvestTask', () => {
    const task: types.HarvestTask = {
      availablePositions: [{ x: 1, y: 2 }],
      sourceId: 'src',
      sourcePosition: { x: 1, y: 2 },
      roomName: 'W1N1',
      requiredWorkParts: 2,
      reservingCreeps: {},
      next: null,
      prev: null
    };
    expect(task.sourceId).to.equal('src');
  });
});
