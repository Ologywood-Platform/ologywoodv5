export function positiveRouteId(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value);
  if (!/^[1-9]\d*$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function singleQueryString(value: unknown, maxLength = 4_096): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength ? value : null;
}
