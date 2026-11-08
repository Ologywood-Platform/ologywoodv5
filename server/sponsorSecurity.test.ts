import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Sponsor and media-kit security boundaries', () => {
  it('uses safe IDs, strict slot ordering, HTTPS URLs, and valid date ranges', () => {
    const source = read('./routers/sponsor.ts');
    expect(source).toContain('const safeId = z.number().int().safe().positive()');
    expect(source).toContain('Only HTTP(S) URLs are allowed');
    expect(source).toContain('Sponsor end date must be on or after the start date.');
    expect(source).toContain('Duplicate sponsor IDs are not allowed');
    expect(source).toContain('displayOrder: z.number().int().min(1).max(MAX_SPONSOR_SLOTS).optional()');
  });

  it('binds analytics writes to an active slot and verified artist owner', () => {
    const source = read('./routers/sponsor.ts');
    expect(source).toContain('artistProfileId: safeId.optional()');
    expect(source).toContain('Provide exactly one artist identifier');
    expect(source).toContain('eq(sponsorSlots.artistId, artistId)');
    expect(source).toContain('eq(sponsorSlots.isActive, true)');
    expect(source).toContain('if (!slot) return { success: false };');
  });

  it('bounds media-kit stats, contacts, and public URLs', () => {
    const source = read('./routers/sponsor.ts');
    expect(source).toContain('followers: z.number().int().min(0).max(2_000_000_000)');
    expect(source).toContain('monthlyListeners: z.number().int().min(0).max(2_000_000_000)');
    expect(source).toContain('pressPhotos: z.array(sponsorUrl).max(10).optional()');
    expect(source).toContain('contactEmail: z.string().trim().email().max(320)');
  });

  it('uses the server’s sponsorSlotId/profile-ID contract on event pages', () => {
    const source = read('../client/src/components/EventSponsorShowcase.tsx');
    expect(source).toContain('sponsorSlotId: sponsor.id');
    expect(source).toContain('artistProfileId');
    expect(source).not.toContain('sponsorId: sponsor.id');
  });
});
