const EVENT_UPDATE_FIELDS = new Set([
  'eventTitle', 'eventType', 'eventDate', 'eventTime', 'eventEndTime',
  'location', 'capacity', 'audienceType', 'rate', 'description', 'isPublic',
]);

const EVENT_TYPES = new Set(['arts_culture', 'bar_gig', 'concert', 'corporate', 'festival', 'other', 'private_party', 'wedding']);
const RECURRENCE_FREQUENCIES = new Set(['daily', 'weekly', 'biweekly', 'monthly']);

function validDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function positiveInteger(value: unknown, maximum = Number.MAX_SAFE_INTEGER): number | null {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^[1-9]\d*$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null;
}

function nonNegativeInteger(value: unknown, maximum = Number.MAX_SAFE_INTEGER): number | null {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^\d+$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null;
}

function boundedText(value: unknown, field: string, max: number, required = false): string | null | { error: string } {
  if (value === undefined) return required ? { error: `${field} is required` } : null;
  if (value === null && !required) return null;
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    return { error: `${field} must be a non-empty string of ${max} characters or fewer` };
  }
  return value.trim();
}

export function validateEventBody(body: unknown, partial = false): { value?: Record<string, unknown>; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Event body must be an object' };
  const input = body as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !EVENT_UPDATE_FIELDS.has(key));
  if (unknown.length) return { error: `Unsupported event field: ${unknown[0]}` };

  const value: Record<string, unknown> = {};
  const title = boundedText(input.eventTitle, 'eventTitle', 255, !partial);
  if (title !== null && typeof title === 'object') return title;
  if (title !== null) value.eventTitle = title;

  if (input.eventType !== undefined) {
    if (typeof input.eventType !== 'string' || !EVENT_TYPES.has(input.eventType)) return { error: 'Invalid event type' };
    value.eventType = input.eventType;
  } else if (!partial) return { error: 'eventType is required' };

  if (input.eventDate !== undefined) {
    if (!validDateOnly(input.eventDate)) return { error: 'eventDate must be a valid YYYY-MM-DD date' };
    value.eventDate = input.eventDate;
  } else if (!partial) return { error: 'eventDate is required' };

  for (const field of ['eventTime', 'eventEndTime'] as const) {
    if (input[field] !== undefined && input[field] !== null && !validTime(input[field])) {
      return { error: `${field} must use HH:MM format` };
    }
    if (input[field] !== undefined) value[field] = input[field] ?? null;
  }

  for (const [field, max] of [['location', 255], ['audienceType', 100], ['description', 10000] ] as const) {
    if (input[field] !== undefined) {
      const text = boundedText(input[field], field, max);
      if (text !== null && typeof text === 'object') return text;
      value[field] = text;
    }
  }

  if (input.capacity !== undefined && input.capacity !== null && input.capacity !== '') {
    const capacity = nonNegativeInteger(input.capacity, 10_000_000);
    if (capacity === null) return { error: 'capacity must be a non-negative whole number of 10000000 or less' };
    value.capacity = capacity;
  } else if (input.capacity !== undefined) value.capacity = null;

  if (input.rate !== undefined && input.rate !== null && input.rate !== '') {
    const rate = typeof input.rate === 'number' ? String(input.rate) : input.rate;
    if (typeof rate !== 'string' || !/^\d{1,8}(?:\.\d{1,2})?$/.test(rate) || Number(rate) > 100_000_000) {
      return { error: 'rate must be a non-negative amount of 100000000 or less with at most two decimals' };
    }
    value.rate = rate;
  } else if (input.rate !== undefined) value.rate = null;

  if (input.isPublic !== undefined) {
    if (typeof input.isPublic !== 'boolean') return { error: 'isPublic must be boolean' };
    value.isPublic = input.isPublic;
  } else if (!partial) value.isPublic = false;

  return { value };
}

export function validateHistoryBody(body: unknown): { value?: Record<string, unknown>; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'History body must be an object' };
  const input = body as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !['eventDate', 'bookingId', 'venueId', 'attendeeCount', 'notes'].includes(key));
  if (unknown.length) return { error: `Unsupported history field: ${unknown[0]}` };
  if (!validDateOnly(input.eventDate)) return { error: 'eventDate must be a valid YYYY-MM-DD date' };
  const value: Record<string, unknown> = { eventDate: input.eventDate };
  for (const field of ['bookingId', 'venueId'] as const) {
    if (input[field] !== undefined && input[field] !== null && input[field] !== '') {
      const parsed = positiveInteger(input[field]);
      if (parsed === null) return { error: `${field} must be a positive integer` };
      value[field] = parsed;
    }
  }
  if (input.attendeeCount !== undefined && input.attendeeCount !== null && input.attendeeCount !== '') {
    const parsed = nonNegativeInteger(input.attendeeCount, 10_000_000);
    if (parsed === null) return { error: 'attendeeCount must be a non-negative whole number of 10000000 or less' };
    value.attendeeCount = parsed;
  }
  const notes = boundedText(input.notes, 'notes', 10000);
  if (notes !== null && typeof notes === 'object') return notes;
  if (notes !== null) value.notes = notes;
  return { value };
}

export function validatePhotoBody(body: unknown): { value?: Record<string, unknown>; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Photo body must be an object' };
  const input = body as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !['photoUrl', 'caption'].includes(key));
  if (unknown.length) return { error: `Unsupported photo field: ${unknown[0]}` };
  if (typeof input.photoUrl !== 'string' || input.photoUrl.length > 2048) return { error: 'photoUrl is required and must be 2048 characters or fewer' };
  try {
    const url = new URL(input.photoUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return { error: 'photoUrl must use HTTP or HTTPS' };
  } catch {
    return { error: 'photoUrl must be a valid URL' };
  }
  const caption = boundedText(input.caption, 'caption', 1000);
  if (caption !== null && typeof caption === 'object') return caption;
  return { value: { photoUrl: input.photoUrl, ...(caption !== null ? { caption } : {}) } };
}

export function validateRecurrenceBody(body: unknown): { value?: Record<string, unknown>; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Recurrence body must be an object' };
  const input = body as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !['frequency', 'daysOfWeek', 'endDate'].includes(key));
  if (unknown.length) return { error: `Unsupported recurrence field: ${unknown[0]}` };
  if (typeof input.frequency !== 'string' || !RECURRENCE_FREQUENCIES.has(input.frequency)) return { error: 'Invalid recurrence frequency' };
  if (input.daysOfWeek !== undefined && input.daysOfWeek !== null && (typeof input.daysOfWeek !== 'string' || input.daysOfWeek.length > 50)) return { error: 'daysOfWeek is invalid' };
  if (input.endDate !== undefined && input.endDate !== null && !validDateOnly(input.endDate)) return { error: 'endDate must be a valid YYYY-MM-DD date' };
  return { value: { frequency: input.frequency, daysOfWeek: input.daysOfWeek ?? null, endDate: input.endDate ?? null } };
}
