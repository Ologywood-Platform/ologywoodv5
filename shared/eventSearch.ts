export function normalizeEventSearchQuery(value: string | undefined): string {
  return (value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

export function eventSearchPattern(value: string | undefined): string | null {
  const normalized = normalizeEventSearchQuery(value);
  return normalized ? `%${normalized}%` : null;
}
