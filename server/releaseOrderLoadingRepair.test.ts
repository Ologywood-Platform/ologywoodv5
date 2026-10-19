import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const manager = read('client/src/pages/ReleaseManager.tsx');
const orderUi = read('client/src/components/ReorderSingles.tsx');

describe('Music Releases loading repair', () => {
  it('shows a retry error before checking the successful list for emptiness', () => {
    const list = manager.slice(manager.indexOf('{/* Release List */}'));
    expect(list.indexOf('myReleasesQuery.isError')).toBeLessThan(list.indexOf('releases.length === 0'));
    expect(list).toContain('Could not load your music releases');
    expect(list).toContain('This does not mean your songs were removed.');
    expect(list).toContain('Retry loading releases');
    expect(list).toContain('void myReleasesQuery.refetch()');
    expect(list).not.toContain('myReleasesQuery.error.message');
  });
  it('distinguishes pending load from a successfully empty list', () => {
    const list = manager.slice(manager.indexOf('{/* Release List */}'));
    expect(list.indexOf('myReleasesQuery.isLoading')).toBeLessThan(list.indexOf('releases.length === 0'));
    expect(list).toContain('Loading your music releases…');
    expect(list).toContain('No releases yet');
    expect(list).toContain('releases.map((release: Release)');
  });
  it('allows cancelling a failed reorder read and retrying without sending a save', () => {
    expect(orderUi).toContain('We could not load the current order. Nothing has been changed.');
    expect(orderUi).toContain('onClick={() => void loadCurrentOrder(true)}');
    expect(orderUi).toContain('onClick={closeDialog} disabled={saveMutation.isPending}>Cancel');
  });
});
