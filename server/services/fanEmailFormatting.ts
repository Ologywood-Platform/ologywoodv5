export function escapeFanEmailHtml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Remove header-breaking characters and bound dynamic email subjects. */
export function sanitizeFanEmailSubject(value: unknown, fallback = 'Ologywood notification'): string {
  const subject = String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
  return subject || fallback;
}

/** Permit only absolute HTTP(S) links in HTML email href attributes. */
export function safeFanEmailHref(value: unknown, fallback = '#'): string {
  try {
    const url = new URL(String(value ?? ''));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback;
    return escapeFanEmailHtml(url.toString());
  } catch {
    return fallback;
  }
}

/** Quote CSV fields and neutralize spreadsheet formula prefixes, including whitespace. */
export function fanEmailCsvCell(value: unknown): string {
  let text = String(value ?? '').replace(/\u0000/g, '');
  if (/^[\s\uFEFF]*[=+\-@]/u.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

/** The scoped public endpoint accepts RFC 8058 POST, never mutating on GET. */
export function fanEmailDeliveryOptions(browserUnsubscribeUrl: string) {
  const url = new URL(browserUnsubscribeUrl);
  if (url.pathname !== '/unsubscribe' || !url.searchParams.get('fanToken') || /[\r\n]/.test(browserUnsubscribeUrl)) {
    throw new Error('Invalid fan unsubscribe link');
  }
  url.pathname = '/api/email/unsubscribe';
  return { timeoutMs: 8000, unsubscribeUrl: url.toString(), oneClickUnsubscribe: true } as const;
}
