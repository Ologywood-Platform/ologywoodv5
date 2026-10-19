import { describe, expect, it } from 'vitest';
import { applyReleaseOrder, moveReleaseOrderItem, sameReleaseOrder, validReleaseOrderIds } from '../shared/releaseOrder';

describe('Profile single order helpers', () => {
  const singles = [{ id: 3, title: 'New' }, { id: 2, title: 'Middle' }, { id: 1, title: 'First' }];
  it('preserves the newest-first baseline before choosing a custom order', () => {
    expect(applyReleaseOrder(singles, [])).toEqual(singles);
  });
  it('applies the full saved order without mutating input metadata or arrays', () => {
    const baseline = structuredClone(singles);
    const ordered = applyReleaseOrder(singles, [1, 3, 2]);
    expect(ordered.map(x => x.id)).toEqual([1, 3, 2]);
    expect(singles).toEqual(baseline); expect(ordered[0]).toBe(singles[2]);
  });
  it('places newly published singles after saved ranks in newest-first order', () => {
    expect(applyReleaseOrder([{ id: 5 }, { id: 4 }, { id: 3 }, { id: 2 }, { id: 1 }], [1, 2, 3]).map(x => x.id)).toEqual([1, 2, 3, 5, 4]);
  });
  it('ignores deleted/unpublished references without hiding current singles', () => {
    expect(applyReleaseOrder(singles, [99, 1, 2]).map(x => x.id)).toEqual([1, 2, 3]);
  });
  it('repositions only hosted Singles, leaving movies and albums in their original slots', () => {
    const rows = [{ id: 10, type: 'movie' }, { id: 3, type: 'single' }, { id: 11, type: 'album' }, { id: 2, type: 'single' }, { id: 1, type: 'single' }];
    expect(applyReleaseOrder(rows, [1, 2, 3], x => x.type === 'single').map(x => x.id)).toEqual([10, 1, 11, 2, 3]);
  });
  it('leaves music draft/archived slots unchanged', () => {
    const rows = [{ id: 9, status: 'draft' }, { id: 3, status: 'published' }, { id: 8, status: 'archived' }, { id: 2, status: 'published' }];
    expect(applyReleaseOrder(rows, [2, 3], x => x.status === 'published').map(x => x.id)).toEqual([9, 2, 8, 3]);
  });
  it('handles empty and one-item lists', () => {
    expect(applyReleaseOrder([], [1])).toEqual([]);
    expect(applyReleaseOrder([{ id: 1 }], [1])).toEqual([{ id: 1 }]);
  });
  it('never duplicates a release even if an old saved list contains duplicate references', () => {
    expect(applyReleaseOrder(singles, [1, 1, 2]).map(x => x.id)).toEqual([1, 2, 3]);
  });
  it('moves up and down as a reversible local draft operation', () => {
    const down = moveReleaseOrderItem(singles, 0, 2);
    expect(down.map(x => x.id)).toEqual([2, 1, 3]);
    expect(moveReleaseOrderItem(down, 2, 0)).toEqual(singles);
    expect(singles.map(x => x.id)).toEqual([3, 2, 1]);
  });
  it.each([[-1, 0], [0, -1], [0, 3], [3, 0], [0.5, 1], [0, Number.NaN]])('ignores out-of-bounds/noninteger movement %s -> %s', (from, to) => {
    expect(moveReleaseOrderItem(singles, from, to)).toEqual(singles);
  });
  it('compares ordered identities rather than just set membership', () => {
    expect(sameReleaseOrder([1, 2], [1, 2])).toBe(true);
    expect(sameReleaseOrder([1, 2], [2, 1])).toBe(false);
    expect(sameReleaseOrder([1], [1, 2])).toBe(false);
  });
  it.each([null, {}, '1,2', [1, 1], [-1], [0], [1.5], ['1'], [Number.MAX_SAFE_INTEGER + 1]])('rejects invalid ID lists %j', value => {
    expect(validReleaseOrderIds(value)).toBe(false);
  });
  it('permits only bounded unique positive safe integer IDs', () => {
    expect(validReleaseOrderIds([])).toBe(true);
    expect(validReleaseOrderIds([1, 2, 3])).toBe(true);
    expect(validReleaseOrderIds(Array.from({ length: 10_001 }, (_, i) => i + 1))).toBe(false);
  });
});
