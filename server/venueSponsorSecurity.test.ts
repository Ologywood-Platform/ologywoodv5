import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Venue sponsorship security boundaries', () => {
  it('bounds package IDs, positive decimal prices, capacities, text, and URLs', () => {
    const source = read('./routers/venueSponsor.ts');
    expect(source).toContain('const safeId = z.number().int().safe().positive()');
    expect(source).toContain('const priceValue = z.string().trim().regex');
    expect(source).toContain('Only HTTP(S) URLs are allowed');
    expect(source).toContain('maxSlots: z.number().int().min(1).max(50).default(1)');
    expect(source).toContain(".strict())");
  });

  it('prevents capacity reductions below active sponsors and scopes approval to the venue', () => {
    const source = read('./routers/venueSponsor.ts');
    expect(source).toContain('Maximum slots cannot be lower than the number of active sponsors.');
    expect(source).toContain('eq(venueSponsorPackages.venueId, ctx.user.id),');
    expect(source).toContain('End date must be on or after the start date.');
  });

  it('protects application and thread boundaries while keeping applicant fields bounded', () => {
    const source = read('./routers/venueSponsor.ts');
    expect(source).toContain('packageId: safeId');
    expect(source).toContain('contactEmail: z.string().trim().email().max(320)');
    expect(source).toContain('promoMaterialUrls: z.array(httpsUrl).max(5).optional()');
    expect(source).toContain('applicationId: safeId');
    expect(source).toContain("content: z.string().trim().min(1).max(2000)");
    expect(source).toContain('Not authorized to view these messages');
  });

  it('joins sponsor dashboard venue names by stored venue user IDs', () => {
    const source = read('./routers/venueSponsor.ts');
    expect(source).toContain('select({ id: venueProfiles.userId, organizationName: venueProfiles.organizationName })');
    expect(source).toContain('where(inArray(venueProfiles.userId, venueIds))');
  });
});
