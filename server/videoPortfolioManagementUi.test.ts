import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (file: string) => readFileSync(resolve(process.cwd(), `client/src/components/${file}`), 'utf8');
const manager = source('VideoPortfolioManager.tsx');
const editTitle = source('EditPortfolioVideoTitle.tsx');
const reorder = source('ReorderPortfolioVideos.tsx');
const guide = source('VideoPortfolioQuickGuide.tsx');

describe('saved video portfolio management UI', () => {
  it('requires signed-in owner context before rendering protected controls or lazy state dialogs', () => {
    expect(manager).toContain('useAuth');
    expect(manager).toContain('enabled: isAuthenticated && currentAccountId !== null');
    expect(manager).toContain('managementContextQuery.data.ownerAccountId === currentAccountId');
    expect(manager).toContain('<ReorderPortfolioVideos context={managementContext} />');
    expect(manager).toContain('<EditPortfolioVideoTitle context={managementContext} videoId={video.id} />');
    expect(editTitle).toContain('enabled: false');
    expect(reorder).toContain('enabled: false');
    expect(editTitle).toContain('loadCurrentTitle(true)');
    expect(reorder).toContain('loadCurrentOrder(true)');
  });

  it('uses frozen CAS snapshots and preserves drafts through failures until an explicit reload', () => {
    expect(editTitle).toContain('expectedTitle: frozen.title');
    expect(editTitle).toContain('Your draft is still here');
    expect(editTitle).toContain('Reload the current title? This discards your unsaved title draft.');
    expect(reorder).toContain('expectedRevision: draft.revision');
    expect(reorder).toContain('loadedIds');
    expect(reorder).toContain('Your draft is still here');
    expect(reorder).toContain('Reload the current order? This discards your unsaved moves.');
    expect(editTitle).toContain('submitPendingRef');
    expect(reorder).toContain('submitPendingRef');
  });

  it('keeps management controls accessible, bounded, and non-autosaving', () => {
    expect(reorder).toContain('GripVertical');
    expect(reorder).toContain('Move Up');
    expect(reorder).toContain('Move Down');
    expect(reorder).toContain('Save Order');
    expect(reorder).toContain('overlayClassName="z-[70]"');
    expect(reorder).toContain('className="z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"');
    expect(manager).toContain('break-words text-sm font-medium');
    expect(manager).toContain('Preparing');
    expect(manager).toContain('We could not load your video portfolio');
    expect(manager).toContain('Retry');
    expect(guide).toContain('How this works');
    expect(guide).toContain('/help?article=video-portfolio-manage-guide');
    expect(guide).toContain('Save');
    expect(guide).toContain('Cancel');
  });

  it('invalidates public and private video views only after confirmed saved mutations', () => {
    for (const component of [editTitle, reorder]) {
      expect(component).toContain('utils.artist.getVideoPortfolio.invalidate({ artistProfileId: context.artistProfileId })');
      expect(component).toContain('utils.artist.getPortfolioVideo.invalidate()');
      expect(component).toContain('utils.artist.getMyVideoPortfolio.invalidate()');
      expect(component).toContain('utils.videoPortfolioManagement.getState.invalidate()');
    }
  });
});


it('keys the private list by the signed-in account and hides cached controls on permission errors', () => {
  const manager = readFileSync(new URL('../client/src/components/VideoPortfolioManager.tsx', import.meta.url), 'utf8');
  const router = readFileSync(new URL('./routers.ts', import.meta.url), 'utf8');
  expect(manager).toContain('{ ownerAccountId: currentAccountId }');
  expect(manager).toContain('enabled: Boolean(managementContext)');
  expect(manager).toContain('!managementContextQuery.isError && !managementContextQuery.isFetching');
  expect(router).toContain('input.ownerAccountId !== ctx.user.id');
});
