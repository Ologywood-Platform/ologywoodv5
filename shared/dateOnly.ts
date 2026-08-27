export type DateOnlyInput = string | Date | null | undefined;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

export function getDateOnlyKey(value: DateOnlyInput): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(DATE_ONLY_PATTERN);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(parsed.getUTCDate()).padStart(2, '0')}`;
  }
  if (Number.isNaN(value.getTime())) return null;
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

export function parseDateOnly(value: DateOnlyInput): Date | null {
  const key = getDateOnlyKey(value);
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function dateOnlyToUtcDate(value: DateOnlyInput): Date {
  const key = getDateOnlyKey(value);
  if (!key) throw new Error('Invalid date-only value');
  return new Date(`${key}T12:00:00.000Z`);
}

export function dateOnlyTimestamp(value: DateOnlyInput): number {
  const key = getDateOnlyKey(value);
  return key ? Date.parse(`${key}T00:00:00.000Z`) : 0;
}

export function formatDateOnly(
  value: DateOnlyInput,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  const parsed = parseDateOnly(value);
  return parsed ? parsed.toLocaleDateString('en-US', options) : 'TBD';
}
