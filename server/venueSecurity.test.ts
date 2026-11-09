import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Venue security boundaries', () => {
  it('uses safe IDs and bounded strict discovery inputs', () => {
    const source = read('./routers/venue.ts');
    expect(source).toContain('const venueProfileId = z.number().int().safe().positive()');
    expect(source).toContain('const venueLimit = z.number().int().min(1).max(100)');
    expect(source).toContain('const venueOffset = z.number().int().min(0).max(1_000_000)');
    expect(source).toContain('Minimum capacity cannot exceed maximum capacity');
    expect(source).toContain('getAvailabilitySummary: publicProcedure');
    expect(source).toContain('Duplicate venue IDs are not allowed');
  });

  it('bounds profile fields and validates operating hours', () => {
    const source = read('./routers/venue.ts');
    expect(source).toContain('const operatingDay = z.object({ open: timeValue, close: timeValue, closed: z.boolean() }).strict()');
    expect(source).toContain('const amenities = z.record(z.string().trim().min(1).max(80), z.boolean())');
    expect(source).toContain('organizationName: z.string().trim().min(1, \'Organization name is required\').max(200)');
    expect(source).toContain('bio: boundedVenueBio.optional()');
    expect(source).toContain('profilePhotoUrl: httpUrl.optional()');
  });

  it('validates venue profile and gallery image data before storage', () => {
    const source = read('./routers/venue.ts');
    expect(source).toContain('const venueImageMime = z.enum');
    expect(source).toContain('const venueImageData = z.string().min(1).max(15_000_000)');
    expect(source).toContain('Image MIME type does not match the data URL.');
    expect(source).toContain('Invalid base64 image data.');
    expect(source).toContain('buffer.length > 10_000_000');
    expect(source).toContain("'image/jpeg': 'jpg'");
  });

  it('bounds photo mutations and calendar/booking inputs', () => {
    const source = read('./routers/venue.ts');
    expect(source).toContain('const venuePhotoId = z.string().trim().min(1).max(100)');
    expect(source).toContain('Duplicate photo IDs are not allowed');
    expect(source).toContain('preferredDate: calendarDate.optional()');
    expect(source).toContain('const publicCalendarUrl = httpUrl.refine');
    expect(source).toContain('Calendar URL must point to a public host');
    expect(source).toContain('escapeHtml(input.message)');
  });

  it('uses encoded random verification tokens and does not log raw exceptions', () => {
    const source = read('./routers/venue.ts');
    expect(source).toContain("randomBytes(32).toString('base64url')");
    expect(source).toContain("error instanceof Error ? error.constructor.name : typeof error");
    expect(source).not.toContain("console.error('[Venue] Send verification email error:', error);");
  });
});
