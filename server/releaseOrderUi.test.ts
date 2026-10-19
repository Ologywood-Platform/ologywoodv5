import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  applyReleaseOrder,
  moveReleaseOrderItem,
  sameReleaseOrder,
} from '../shared/releaseOrder';

const read = (relativePath: string) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
const reorderUi = read('client/src/components/ReorderSingles.tsx');
const musicManager = read('client/src/pages/ReleaseManager.tsx');
const contentManager = read('client/src/pages/ContentReleases.tsx');

describe('Reorder Singles UI contract', () => {
  it('moves only eligible single slots and leaves other release content in place', () => {
    const rows = [
      { id: 10, type: 'movie' },
      { id: 11, type: 'single' },
      { id: 12, type: 'album' },
      { id: 13, type: 'single' },
    ];

    expect(applyReleaseOrder(rows, [13, 11], (row) => row.type === 'single'))
      .toEqual([
        { id: 10, type: 'movie' },
        { id: 13, type: 'single' },
        { id: 12, type: 'album' },
        { id: 11, type: 'single' },
      ]);
  });

  it('keeps a local move immutable and makes an unchanged draft distinguishable', () => {
    const initial = [1, 2, 3];
    const moved = moveReleaseOrderItem(initial, 2, 0);

    expect(initial).toEqual([1, 2, 3]);
    expect(moved).toEqual([3, 1, 2]);
    expect(sameReleaseOrder(initial, moved)).toBe(false);
    expect(sameReleaseOrder(initial, [1, 2, 3])).toBe(true);
  });

  it('uses a protected, owner-gated request only while the dialog is open', () => {
    expect(reorderUi).toContain('enabled: false');
    expect(reorderUi).toContain('if (!dialogOpen || !enabled || !ownerAccountId || saveMutation.isPending) return;');
    expect(reorderUi).toContain('staleTime: 0');
    expect(reorderUi).toContain('refetchOnMount: "always"');
    expect(reorderUi).toContain('if (!enabled || !ownerAccountId) return null;');
    expect(reorderUi).not.toContain('as any');
  });

  it('freezes the loaded revision and ID baseline so cache updates cannot replace a local draft', () => {
    expect(reorderUi).toContain('loadedIds: number[]');
    expect(reorderUi).toContain('loadedIds: order.items.map((item) => item.id)');
    expect(reorderUi).toContain('!sameReleaseOrder(draft.items.map((item) => item.id), draft.loadedIds)');
    expect(reorderUi).toContain('if (replaceDraft || !draft) setDraft(freezeOrder(result.data));');
  });

  it('offers handle drag plus keyboard/mobile movement and has explicit save semantics', () => {
    for (const phrase of [
      'draggable={!isPending}',
      'Drag ${item.title} to reorder',
      'Move Up',
      'Move Down',
      'Save Order',
      'expectedRevision: draft.revision',
      'ids: draft.items.map((item) => item.id)',
    ]) expect(reorderUi).toContain(phrase);
    expect(reorderUi).toContain('submitPendingRef.current = true;');
  });

  it('makes reset an explicit, confirmed persistence operation rather than an automatic update', () => {
    expect(reorderUi).toContain('window.confirm("Reset this single order to newest first? This discards any unsaved moves.")');
    expect(reorderUi).toContain('submitOrder(true);');
    expect(reorderUi).toContain('reset: true');
    expect(reorderUi).toContain('Reset to Newest');
  });

  it('retains a failed draft and exposes explicit retry and reload paths without exposing backend error text', () => {
    expect(reorderUi).toContain('Your local draft has not been lost.');
    expect(reorderUi).toContain('Retry');
    expect(reorderUi).toContain('Reload current order');
    expect(reorderUi).toContain('safeSaveError(error.data?.code)');
    expect(reorderUi).toContain('onEscapeKeyDown={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}');
    expect(reorderUi).toContain('overlayClassName="z-[70]"');
    expect(reorderUi).toContain('sm:flex-nowrap');
    expect(reorderUi).toContain('disabled={saveMutation.isPending}>Cancel');
    expect(reorderUi).toContain('onPointerDownOutside={(event) => { if (saveMutation.isPending || submitPendingRef.current) event.preventDefault(); }}');
  });

  it('mounts only in each manager list header, using the actual creator-owner gate and the correct single kind', () => {
    expect(musicManager).toContain('kind="music" enabled={isCreatorOwner}');
    expect(contentManager).toContain('kind="content_singles" enabled={isCreatorOwner}');
    for (const source of [musicManager, contentManager]) {
      expect(source).toContain('teamContextQuery.isSuccess && !teamContext');
      expect(source).toContain('user?.role === "artist"');
      expect(source).toContain('user?.role === "admin"');
      expect(source).toContain('ownerProfileQuery.data?.userId === user?.id');
      expect(source).toContain('ownerProfileQuery.isSuccess');
    }

    const musicHeader = musicManager.indexOf('<ReorderSingles');
    const musicForm = musicManager.indexOf('<ReleaseForm');
    const contentHeader = contentManager.indexOf('<ReorderSingles');
    const contentForm = contentManager.indexOf('// ===== CREATE/EDIT FORM =====');
    expect(musicHeader).toBeGreaterThan(-1);
    expect(musicHeader).toBeLessThan(musicForm);
    expect(contentHeader).toBeGreaterThan(-1);
    expect(contentHeader).toBeGreaterThan(contentForm);
  });
});
