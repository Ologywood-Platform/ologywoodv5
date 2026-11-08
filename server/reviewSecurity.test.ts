import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers.ts'), 'utf8');

describe('review security boundaries', () => {
  it('uses strict safe IDs, integer ratings, and bounded review text', () => {
    expect(source).toContain('const reviewRating = z.number().int().min(1).max(5)');
    expect(source).toContain('const reviewResponse = z.string().trim().min(1).max(2_000)');
    expect(source).toContain('bookingId: z.number().int().safe().positive()');
    expect(source).toContain('reviewId: z.number().int().safe().positive()');
    expect(source).toContain('}).strict())');
  });

  it('binds booking reviews to the submitting party and the booking target', () => {
    expect(source).toContain("message: 'You can only review an artist from your completed booking'");
    expect(source).toContain("message: 'You can only review a venue from your completed booking'");
    expect(source).toContain('booking.venueId !== venueProfile.id || booking.artistId !== input.artistId');
    expect(source).toContain('booking.artistId !== artistProfile.id || booking.venueId !== input.venueId');
  });

  it('requires a venue profile for profile-based review attribution and owner checks for responses', () => {
    expect(source).toContain("message: 'Only venues can leave profile reviews'");
    expect(source).toContain('venueId: venueProfile.id');
    expect(source).toContain('artistProfile.id !== review.artistId');
    expect(source).toContain('venueProfile.id !== review.venueId');
  });
});
