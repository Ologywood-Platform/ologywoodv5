import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  dateOnlyTimestamp,
  dateOnlyToUtcDate,
  formatDateOnly,
  getDateOnlyKey,
  parseDateOnly,
} from '../shared/dateOnly';
import {
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_VALUES,
  formatEventTypeLabel,
  getDefaultArtistEventType,
} from '../shared/eventTypes';

const projectRoot = path.resolve(__dirname, '..');

describe('Arts & Culture event category', () => {
  it('includes the Arts & Culture category in the shared alphabetical taxonomy', () => {
    expect(EVENT_TYPE_VALUES).toContain('arts_culture');
    expect(formatEventTypeLabel('arts_culture')).toBe('Arts & Culture');
    const labels = EVENT_TYPE_OPTIONS.map((option) => option.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it('accepts and persists the artist-selected category instead of forcing Concert', () => {
    const routerSource = fs.readFileSync(path.join(projectRoot, 'server/routers/events.ts'), 'utf8');
    const createFormSource = fs.readFileSync(path.join(projectRoot, 'client/src/components/ArtistEventPostForm.tsx'), 'utf8');
    const editFormSource = fs.readFileSync(path.join(projectRoot, 'client/src/pages/EventEdit.tsx'), 'utf8');

    expect(routerSource).toContain('eventType: z.enum(EVENT_TYPE_VALUES)');
    expect(routerSource).toContain('eventType: input.eventType');
    expect(routerSource).not.toContain("eventType: 'concert', // Default for artist posts");
    expect(createFormSource).toContain('EVENT_TYPE_OPTIONS.map');
    expect(createFormSource).toContain('eventType: selectedEventType');
    expect(editFormSource).toContain('EVENT_TYPE_OPTIONS.map');
    expect(editFormSource).toContain('eventType: formData.eventType');
  });

  it('defaults only new Visual Artist events to Arts & Culture', () => {
    const createFormSource = fs.readFileSync(path.join(projectRoot, 'client/src/components/ArtistEventPostForm.tsx'), 'utf8');

    expect(getDefaultArtistEventType('visual_artist')).toBe('arts_culture');
    expect(getDefaultArtistEventType('artist')).toBe('');
    expect(getDefaultArtistEventType('creator')).toBe('');
    expect(getDefaultArtistEventType(undefined)).toBe('');
    expect(createFormSource).toContain('formData.eventType || getDefaultArtistEventType');
    expect(createFormSource).toContain('eventType: selectedEventType');
    expect(createFormSource).toContain('Arts & Culture is suggested for Visual Artist profiles');
  });

  it('preserves the saved category when editing an existing event', () => {
    const editFormSource = fs.readFileSync(path.join(projectRoot, 'client/src/pages/EventEdit.tsx'), 'utf8');

    expect(editFormSource).toContain("eventType: event.eventType || ''");
    expect(editFormSource).not.toContain('getDefaultArtistEventType');
  });
});

describe('event date-only handling', () => {
  it('preserves September 3 from the UTC-midnight value returned by the database', () => {
    const databaseValue = new Date('2026-09-03T00:00:00.000Z');

    expect(getDateOnlyKey(databaseValue)).toBe('2026-09-03');
    expect(getDateOnlyKey('2026-09-03T00:00:00.000Z')).toBe('2026-09-03');
    expect(formatDateOnly(databaseValue, { month: 'short', day: 'numeric', year: 'numeric' })).toBe('Sep 3, 2026');
  });

  it('parses a date-only value at local noon and serializes it at UTC noon', () => {
    const localDate = parseDateOnly('2026-10-17');
    const utcDate = dateOnlyToUtcDate('2026-10-17');

    expect(localDate?.getFullYear()).toBe(2026);
    expect(localDate?.getMonth()).toBe(9);
    expect(localDate?.getDate()).toBe(17);
    expect(localDate?.getHours()).toBe(12);
    expect(utcDate.toISOString()).toBe('2026-10-17T12:00:00.000Z');
    expect(dateOnlyTimestamp('2026-10-17') - dateOnlyTimestamp('2026-10-16')).toBe(86_400_000);
  });

  it('uses the shared formatter on the reported card, dashboard, profile, and detail surfaces', () => {
    const files = [
      'client/src/components/EventCard.tsx',
      'client/src/pages/ArtistDashboardV3.tsx',
      'client/src/pages/ArtistProfile.tsx',
      'client/src/pages/EventDetail.tsx',
      'client/src/components/SimilarEvents.tsx',
      'client/src/pages/VenueProfile.tsx',
    ];

    for (const file of files) {
      expect(fs.readFileSync(path.join(projectRoot, file), 'utf8')).toContain('formatDateOnly');
    }
  });
});
