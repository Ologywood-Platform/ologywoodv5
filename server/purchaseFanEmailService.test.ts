import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  followUser: vi.fn(),
  getFanEmailConsent: vi.fn(),
  setFanEmailConsent: vi.fn(),
}));

vi.mock('./services/followService', () => ({ followUser: mocks.followUser }));
vi.mock('./services/fanEmailConsentService', () => ({
  getFanEmailConsent: mocks.getFanEmailConsent,
  setFanEmailConsent: mocks.setFanEmailConsent,
}));

import { capturePurchaseFanEmailOptIn } from './services/purchaseFanEmailService';

describe('purchase fan email opt-in capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.followUser.mockResolvedValue(true);
    mocks.getFanEmailConsent.mockResolvedValue({
      optedIn: false,
      revision: 2,
      isFollowing: true,
      globallyBlocked: false,
      emailVerified: true,
    });
    mocks.setFanEmailConsent.mockResolvedValue({ optedIn: true });
  });

  it('does not create a fan relationship when opt-in was not requested', async () => {
    await expect(capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: 20, optIn: false }))
      .resolves.toEqual({ captured: false, reason: 'not_requested' });
    expect(mocks.followUser).not.toHaveBeenCalled();
  });

  it('follows the creator and records consent using the current revision', async () => {
    await expect(capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: 20, optIn: true }))
      .resolves.toEqual({ captured: true });
    expect(mocks.followUser).toHaveBeenCalledWith(20, 10, 'artist');
    expect(mocks.getFanEmailConsent).toHaveBeenCalledWith(20, 10);
    expect(mocks.setFanEmailConsent).toHaveBeenCalledWith(20, 10, { optIn: true, expectedRevision: 2 });
  });

  it('does not write a duplicate consent row when the buyer is already opted in', async () => {
    mocks.getFanEmailConsent.mockResolvedValueOnce({ optedIn: true, revision: 4 });
    await expect(capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: 20, optIn: true }))
      .resolves.toEqual({ captured: true });
    expect(mocks.setFanEmailConsent).not.toHaveBeenCalled();
  });

  it('fails closed when consent storage rejects the optional capture', async () => {
    mocks.setFanEmailConsent.mockRejectedValueOnce(new Error('email not verified'));
    await expect(capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: 20, optIn: true }))
      .resolves.toEqual({ captured: false, reason: 'consent_unavailable' });
  });

  it('never captures a guest or self-purchase as an artist fan', async () => {
    await expect(capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: null, optIn: true }))
      .resolves.toEqual({ captured: false, reason: 'buyer_not_authenticated' });
    await expect(capturePurchaseFanEmailOptIn({ creatorUserId: 10, buyerUserId: 10, optIn: true }))
      .resolves.toEqual({ captured: false, reason: 'self_purchase' });
    expect(mocks.followUser).not.toHaveBeenCalled();
  });
});
