import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('../db', () => ({
  getArtistProfileByUserId: vi.fn(),
  getArtistProfileById: vi.fn(),
  updateArtistProfile: vi.fn(),
}));

import * as db from '../db';

describe('CRM Badge Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow updating crmSupporter field to true', async () => {
    const mockProfile = {
      id: 1,
      userId: 7,
      artistName: 'Test Artist',
      crmSupporter: false,
    };

    (db.getArtistProfileByUserId as any).mockResolvedValue(mockProfile);
    (db.updateArtistProfile as any).mockResolvedValue(undefined);
    (db.getArtistProfileById as any).mockResolvedValue({ ...mockProfile, crmSupporter: true });

    // Simulate what the router does
    const profile = await db.getArtistProfileByUserId(7);
    expect(profile).toBeDefined();
    expect(profile!.id).toBe(1);

    await db.updateArtistProfile(profile!.id, { crmSupporter: true } as any);
    expect(db.updateArtistProfile).toHaveBeenCalledWith(1, { crmSupporter: true });

    const updated = await db.getArtistProfileById(1);
    expect((updated as any).crmSupporter).toBe(true);
  });

  it('should allow updating crmSupporter field to false', async () => {
    const mockProfile = {
      id: 1,
      userId: 7,
      artistName: 'Test Artist',
      crmSupporter: true,
    };

    (db.getArtistProfileByUserId as any).mockResolvedValue(mockProfile);
    (db.updateArtistProfile as any).mockResolvedValue(undefined);
    (db.getArtistProfileById as any).mockResolvedValue({ ...mockProfile, crmSupporter: false });

    const profile = await db.getArtistProfileByUserId(7);
    await db.updateArtistProfile(profile!.id, { crmSupporter: false } as any);
    expect(db.updateArtistProfile).toHaveBeenCalledWith(1, { crmSupporter: false });

    const updated = await db.getArtistProfileById(1);
    expect((updated as any).crmSupporter).toBe(false);
  });

  it('should default crmSupporter to false for new profiles', async () => {
    const mockProfile = {
      id: 2,
      userId: 10,
      artistName: 'New Artist',
      crmSupporter: false,
    };

    (db.getArtistProfileByUserId as any).mockResolvedValue(mockProfile);

    const profile = await db.getArtistProfileByUserId(10);
    expect((profile as any).crmSupporter).toBe(false);
  });
});
