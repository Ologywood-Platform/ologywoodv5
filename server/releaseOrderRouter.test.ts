import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from './_core/context';
const mocks = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('./services/releaseOrderService', () => ({ getReleaseOrderStateForUser: mocks.get, saveReleaseOrderForUser: mocks.save }));
import { releaseOrderRouter } from './routers/releaseOrder';
const state = { kind: 'music', revision: 1, custom: true, items: [{ id: 1, title: 'Synthetic single' }] };
function caller(authenticated = true) {
  return releaseOrderRouter.createCaller({ user: authenticated ? { id: 700, role: 'admin', emailVerified: true } : null, req: { headers: {} }, res: {} } as unknown as TrpcContext);
}
beforeEach(() => { vi.clearAllMocks(); mocks.get.mockResolvedValue(state); mocks.save.mockResolvedValue(state); });

describe('Protected profile release order endpoints', () => {
  it('requires login for reads without reaching the owner service', async () => {
    await expect(caller(false).get({ kind: 'music' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it('requires login for saves without reaching the owner service', async () => {
    await expect(caller(false).save({ kind: 'music', expectedRevision: 0, ids: [1] })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('derives scope from the caller even for an admin and ignores forged profile IDs', async () => {
    await caller().save({ kind: 'music', expectedRevision: 0, ids: [1], profileId: 999, userId: 999 } as any);
    expect(mocks.save).toHaveBeenCalledWith(700, { kind: 'music', expectedRevision: 0, ids: [1] });
  });
  it('passes only the current account to the protected state reader', async () => {
    await caller().get({ kind: 'music' }); expect(mocks.get).toHaveBeenCalledWith(700, 'music');
  });
  it.each([{ kind: 'invalid', expectedRevision: 0, ids: [1] }, { kind: 'music', expectedRevision: -1, ids: [1] }, { kind: 'music', expectedRevision: 0, ids: [0] }, { kind: 'music', expectedRevision: 0, ids: [1.5] }, { kind: 'music', expectedRevision: 0, ids: Array.from({ length: 10_001 }, (_, i) => i + 1) }])('rejects invalid/bulk inputs before service execution', async input => {
    await expect(caller().save(input as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
