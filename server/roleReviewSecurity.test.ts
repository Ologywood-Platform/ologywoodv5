import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers.ts'), 'utf8');

function sectionBetween(startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('role and review privacy boundaries', () => {
  it('does not expose a public user-role mutation', () => {
    const section = sectionBetween('auth: router({', '// Artist Profile Management');
    expect(section).toContain('setUserRole: adminProcedure');
    expect(section).toContain('userId: z.number().int().safe().positive()');
    expect(section).toContain("role: z.enum(['artist', 'venue'])");
    expect(section).not.toContain('setUserRole: publicProcedure');
  });

  it('sanitizes ordinary public reviews and hides unfinished booking reviews', () => {
    const helper = sectionBetween('function toPublicReview', '// Complimentary owner access');
    expect(helper).toContain('reviewText: review.reviewText ?? review.comment');
    expect(helper).not.toContain('reviewerUserId');
    expect(helper).not.toContain('bookingId: review.bookingId');

    const section = sectionBetween('review: router({', '// Venue Review Management');
    expect(section).toContain('return (reviews || []).map(toPublicReview)');
    expect(section).toContain("booking.status !== 'completed'");
    expect(section).not.toContain('return review || null');
  });

  it('party-scopes protected venue and artist review reads', () => {
    const venueSection = sectionBetween('venueReview: router({', '// Artist Review Management');
    expect(venueSection).toContain('isBookingParty(ctx.user, booking)');
    expect(venueSection).toContain('getBookingsByArtistId(artistProfile.id)');
    expect(venueSection).toContain('Not authorized to view these venue reviews');
    expect(venueSection).toContain('map(toPublicReview)');

    const artistSection = sectionBetween('artistReview: router({', '// Subscription Management');
    expect(artistSection).toContain('isBookingParty(ctx.user, booking)');
    expect(artistSection).toContain('getBookingsByVenueId(venueProfile.id)');
    expect(artistSection).toContain('Not authorized to view these artist reviews');
    expect(artistSection).toContain('map(toPublicReview)');
  });
});
