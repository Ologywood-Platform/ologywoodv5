import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/events.ts'), 'utf8');

describe('event router security boundaries', () => {
  it('uses strict bounded event schemas and safe identifiers', () => {
    expect(source).toContain('const eventId = z.number().int().safe().positive()');
    expect(source).toContain('const eventTitle = z.string().trim().min(1).max(200)');
    expect(source).toContain('const eventTime = z.string().regex');
    expect(source).toContain('const eventCapacity = z.number().int().min(0).max(2_000_000)');
    expect(source).toContain("}).strict().refine((value) => value.minRate");
    expect(source).toContain("eventType: z.enum(EVENT_TYPE_VALUES)");
  });

  it('restricts event URLs and public lookup slugs', () => {
    expect(source).toContain("const publicEventUrl = z.string().trim().url().max(2_000)");
    expect(source).toContain("slug: z.string().trim().min(1).max(255).regex");
    expect(source).toContain("if (!event || !event.isPublic)");
    expect(source).toContain("if (!found || !found.isPublic) return null");
    expect(source).toContain('return events.filter((event) => event.isPublic)');
  });

  it('binds venue events and generic mutations to real booking/profile ownership', () => {
    expect(source).toContain("if (booking.artistId !== input.artistId) throw new Error('Event artist must match the booking artist')");
    expect(source).toContain("const ownsEvent = existing.artistId === artistProfile?.id || existing.venueId === venueProfile?.id");
    expect(source).toContain("Not authorized to edit this event");
    expect(source).toContain("Not authorized to delete this event");
    expect(source).toContain("Not authorized to create recurrence for this event");
  });

  it('binds event history references and photo mutations to the artist owner', () => {
    expect(source).toContain("Referenced event does not belong to this artist");
    expect(source).toContain("Referenced booking does not belong to this artist");
    expect(source).toContain("Not authorized to add photos to this entry");
    expect(source).toContain("Not authorized to delete this photo");
  });

  it('validates event photo MIME/data and decoded size before storage', () => {
    expect(source).toContain("const eventPhotoMime = z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])");
    expect(source).toContain('Photo MIME type does not match the data URL.');
    expect(source).toContain('Invalid photo data.');
    expect(source).toContain('decodedSize > 10_000_000');
    expect(source).toContain('eventPhotoFileName');
  });

  it('redacts asynchronous fan-notification exceptions', () => {
    expect(source).toContain('function eventErrorKind(error: unknown): string');
    expect(source).not.toContain("Fan notification failed:', err);");
  });
});
