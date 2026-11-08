import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateEventBody, validateHistoryBody, validatePhotoBody, validateRecurrenceBody } from './routes/eventInput';

describe('legacy event route security boundaries', () => {
  it('allowlists event update fields and rejects injected columns', () => {
    expect(validateEventBody({ eventTitle: 'Art show', eventType: 'arts_culture', eventDate: '2026-12-01', isPublic: true }).error).toBeUndefined();
    expect(validateEventBody({ status: 'completed' }, true).error).toContain('Unsupported event field');
  });

  it('rejects invalid dates, times, rates, capacities, and booleans', () => {
    expect(validateEventBody({ eventTitle: 'Show', eventType: 'concert', eventDate: '2026-02-31', isPublic: false }).error).toContain('eventDate');
    expect(validateEventBody({ eventTitle: 'Show', eventType: 'concert', eventDate: '2026-12-01', eventTime: '25:00', isPublic: false }).error).toContain('eventTime');
    expect(validateEventBody({ eventTitle: 'Show', eventType: 'concert', eventDate: '2026-12-01', capacity: '12.5', isPublic: false }).error).toContain('capacity');
    expect(validateEventBody({ eventTitle: 'Show', eventType: 'concert', eventDate: '2026-12-01', rate: '9.999', isPublic: false }).error).toContain('rate');
    expect(validateEventBody({ eventTitle: 'Show', eventType: 'concert', eventDate: '2026-12-01', isPublic: 'yes' }).error).toContain('isPublic');
    expect(validateEventBody({ eventTitle: 'Show', eventType: 'concert', eventDate: '2026-12-01', capacity: 0, isPublic: false }).value?.capacity).toBe(0);
  });

  it('validates history references and photo URLs before database writes', () => {
    expect(validateHistoryBody({ eventDate: '2026-12-01', bookingId: 'bad' }).error).toContain('bookingId');
    expect(validateHistoryBody({ eventDate: '2026-12-01', attendeeCount: 12.5 }).error).toContain('attendeeCount');
    expect(validatePhotoBody({ photoUrl: 'javascript:alert(1)' }).error).toContain('HTTP or HTTPS');
    expect(validatePhotoBody({ photoUrl: 'https://cdn.example/photo.jpg', caption: 'Live show' }).value).toMatchObject({ photoUrl: 'https://cdn.example/photo.jpg' });
    expect(validateHistoryBody({ eventDate: '2026-12-01', attendeeCount: 0 }).value?.attendeeCount).toBe(0);
    expect(validateHistoryBody({ eventDate: '2026-12-01', privateField: 'x' }).error).toContain('Unsupported history field');
    expect(validatePhotoBody({ photoUrl: 'https://cdn.example/photo.jpg', extra: 'x' }).error).toContain('Unsupported photo field');
  });

  it('validates recurrence frequency, date, and bounded days', () => {
    expect(validateRecurrenceBody({ frequency: 'hourly' }).error).toContain('frequency');
    expect(validateRecurrenceBody({ frequency: 'weekly', endDate: '2026-02-31' }).error).toContain('endDate');
    expect(validateRecurrenceBody({ frequency: 'weekly', daysOfWeek: 'MON,WED' }).error).toBeUndefined();
    expect(validateRecurrenceBody({ frequency: 'weekly', ignored: true }).error).toContain('Unsupported recurrence field');
  });

  it('keeps event update and photo mutations ownership-scoped in the route source', () => {
    const source = readFileSync('server/routes/events.ts', 'utf8');
    expect(source).toContain('event.artistId !== user.id');
    expect(source).toContain('history.artistId !== (req as any).user.id');
    expect(source).toContain('getEventPhotoById(parseInt(photoId))');
    expect(source).toContain('validateEventBody(req.body, true)');
    expect(source).not.toContain('updateEvent(parseInt(id), {\n      ...req.body');
  });
});
