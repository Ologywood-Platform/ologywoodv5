export function escapeFanEmailHtml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
