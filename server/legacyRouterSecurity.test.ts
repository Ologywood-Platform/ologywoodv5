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

describe('legacy router security boundaries', () => {
  it('uses safe strict artist IDs for favorite mutations and counts', () => {
    const section = sectionBetween('favorite: router({', '// Booking template router');
    expect(section).toContain('.input(z.object({ artistId: favoriteArtistId }).strict())');
    expect(section).not.toContain('artistId: z.number()');
  });

  it('bounds booking templates and persists only schema-backed fields', () => {
    const section = sectionBetween('// Booking template router', '// Analytics router');
    expect(section).toContain('templateName: bookingTemplateName');
    expect(section).toContain('Budget maximum must be at least the budget minimum');
    expect(section).toContain('Deposit cannot exceed total fee');
    expect(section).toContain('const updates: Partial<schema.InsertBookingTemplate> = {}');
    expect(section).toContain("template.venueId !== ctx.user.id");
    expect(section).not.toContain('const { id, ...updates } = input');
  });

  it('does not expose public diagnostics or a public email-reminder trigger', () => {
    const debug = sectionBetween('// Debug endpoint for testing input parsing', '// Subscription Management');
    expect(debug).toContain('testPublicInput: adminProcedure');
    expect(debug).toContain('testProtectedInput: adminProcedure');
    expect(debug).toContain('testDatabase: adminProcedure');
    const reminders = sectionBetween('// Reminders router (for testing/manual trigger)', '// Calendar router');
    expect(reminders).toContain('checkAndSend: adminProcedure');
  });

  it('validates analytics and calendar windows with strict finite inputs', () => {
    const section = sectionBetween('// Analytics router', '// Reminders router');
    expect(section).toContain('.input(z.object({ artistId: artistProfileId }).strict())');
    expect(section).toContain('days: z.number().int().min(1).max(365).optional()');
    expect(section).toContain('months: z.number().int().min(1).max(120).optional()');
    const calendar = sectionBetween('// Calendar router', '// Payment Management');
    expect(calendar).toContain('.input(bookingCalendarRange)');
  });

  it('party-scopes legacy checkout, verification, history, and refunds', () => {
    const section = sectionBetween('// Payment Management', '// Rider Template Management');
    expect(section).toContain('bookingId: bookingIdInput');
    expect(section).toContain('trustedCheckoutOrigin(process.env.BASE_URL, ctx.req.headers.origin)');
    expect(section).toContain("booking.status === 'cancelled'");
    expect(section).toContain('Not authorized for this booking');
    expect(section).toContain('s.amount_total');
    expect(section).toContain('sessionAmount >= expected');
    expect(section).toContain('This booking has already been refunded');
  });
});
