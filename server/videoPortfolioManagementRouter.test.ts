import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  context: vi.fn(),
  state: vi.fn(),
  edit: vi.fn(),
  save: vi.fn(),
}));

vi.mock('./services/videoPortfolioManagementService', () => ({
  getVideoPortfolioManagementContextForUser: service.context,
  getVideoPortfolioManagementStateForUser: service.state,
  editVideoPortfolioTitleForUser: service.edit,
  saveVideoPortfolioOrderForUser: service.save,
}));

import { videoPortfolioManagementRouter } from './routers/videoPortfolioManagement';

const caller = (user: unknown) => videoPortfolioManagementRouter.createCaller({ user } as any);

beforeEach(() => {
  vi.clearAllMocks();
  service.context.mockResolvedValue({ ownerAccountId: 7, artistProfileId: 70 });
  service.state.mockResolvedValue({ artistProfileId: 70, items: [], revision: 'a'.repeat(64) });
  service.edit.mockResolvedValue({ id: 11, title: 'Renamed' });
  service.save.mockResolvedValue({ artistProfileId: 70, items: [], revision: 'b'.repeat(64) });
});

describe('videoPortfolioManagementRouter', () => {
  it('is protected and does not grant generic unauthenticated access', async () => {
    await expect(caller(null).getState()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(service.state).not.toHaveBeenCalled();
  });

  it('delegates authenticated context and fresh state to service-level actual-owner enforcement', async () => {
    // Role is intentionally not used here: the service verifies the account is
    // the actual creator owner, including an administrator who owns a profile.
    await expect(caller({ id: 7, role: 'admin' }).context()).resolves.toEqual({ ownerAccountId: 7, artistProfileId: 70 });
    await expect(caller({ id: 7, role: 'admin' }).getState()).resolves.toMatchObject({ artistProfileId: 70 });
    expect(service.context).toHaveBeenCalledWith(7);
    expect(service.state).toHaveBeenCalledWith(7);
  });

  it('accepts only strict title CAS input and trims the desired title', async () => {
    await expect(caller({ id: 7, role: 'artist' }).editTitle({ id: 11, title: '  Renamed  ', expectedTitle: 'Old title' }))
      .resolves.toEqual({ id: 11, title: 'Renamed' });
    expect(service.edit).toHaveBeenCalledWith(7, { id: 11, title: 'Renamed', expectedTitle: 'Old title' });

    await expect(caller({ id: 7, role: 'artist' }).editTitle({ id: 11, title: 'x', expectedTitle: 'old', status: 'active' } as any))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller({ id: 7, role: 'artist' }).editTitle({ id: 11, title: '   ', expectedTitle: 'old' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('accepts only strict unique bounded positive order IDs and a sha256 revision', async () => {
    await expect(caller({ id: 7, role: 'artist' }).saveOrder({ ids: [12, 11], expectedRevision: 'a'.repeat(64) }))
      .resolves.toMatchObject({ revision: 'b'.repeat(64) });
    expect(service.save).toHaveBeenCalledWith(7, { ids: [12, 11], expectedRevision: 'a'.repeat(64) });

    for (const input of [
      { ids: [11, 11], expectedRevision: 'a'.repeat(64) },
      { ids: [0], expectedRevision: 'a'.repeat(64) },
      { ids: [11], expectedRevision: 'not-a-sha256' },
      { ids: [11], expectedRevision: 'a'.repeat(64), title: 'injected' },
    ]) {
      await expect(caller({ id: 7, role: 'artist' }).saveOrder(input as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    }
  });
});
