import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const calendar = readFileSync('server/routes/calendarFeed.ts', 'utf8');
const media = readFileSync('server/routes/mediaUploads.ts', 'utf8');
const invoice = readFileSync('server/routes/invoiceDownload.ts', 'utf8');
const releaseDownload = readFileSync('server/routes/releaseDownload.ts', 'utf8');
const releaseUpload = readFileSync('server/routes/releaseUpload.ts', 'utf8');
const events = readFileSync('server/routes/events.ts', 'utf8');

describe('reachable Express boundary hardening', () => {
  it('escapes complete iCalendar descriptions, including CRLF', () => {
    expect(calendar).toContain(".replace(/\\r\\n?|\\n/g, '\\\\n');");
    expect(calendar).toContain('`DESCRIPTION:${escapeICalText(description)}`');
    expect(calendar).not.toContain('`DESCRIPTION:${description}`');
    expect(calendar).toContain("kind: error instanceof Error ? error.name : 'UnknownError'");
    expect(calendar).toContain("import { positiveRouteId, singleQueryString } from './routeInput';");
    expect(calendar).not.toContain('req.query.token as string');
  });

  it('rejects coerced media upload IDs and chunk indexes before service access', () => {
    expect(media).toContain("const UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;");
    expect(media).toContain("/^(?:0|[1-9][0-9]*)$/");
    expect(media).toContain("if (!id) return res.status(400).json({ error: 'Invalid upload ID.'");
    expect(media).not.toContain('const index = Number(req.params.index);');
    expect(media).toContain("Object.keys(value).some(key => !allowed.has(key))");
  });

  it('keeps invoice/release route logs free of raw exceptions and private identifiers', () => {
    expect(invoice).toContain("kind: error instanceof Error ? error.name : 'UnknownError'");
    expect(releaseDownload).toContain("console.log('[Release Download] Download issued');");
    expect(releaseDownload).toContain('kind: error instanceof Error ? error.name : "UnknownError"');
    expect(releaseUpload).toContain('kind: error instanceof Error ? error.name : "UnknownError"');
    expect(releaseDownload).not.toContain('console.error("[Release Download] Error:", error)');
    expect(releaseUpload).not.toContain('console.error("[Release Upload] Audio upload error:", error)');
  });

  it('uses strict shared IDs across event CRUD, recurrence, history, photos, and saved-event routes', () => {
    expect(events).toContain("import { positiveRouteId, singleQueryString } from './routeInput';");
    expect(events).toContain('const parsed = positiveRouteId(value);');
    expect(events).not.toContain('const parsed = Number(value);');
    expect(events).not.toContain('parseInt(');
    expect(events).toContain("kind: error instanceof Error ? error.name : 'UnknownError'");
    expect(events).not.toContain("console.error('Error creating event:', error)");
  });
});
