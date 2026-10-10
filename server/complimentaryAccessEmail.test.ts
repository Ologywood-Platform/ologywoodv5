import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('./email', () => ({ sendEmail: vi.fn() }));
import { sendEmail } from './email';
import { buildComplimentaryAccessEmail, sendComplimentaryAccessEmail } from './services/complimentaryAccessEmail';
import { EMAIL_LOGO_URL } from '../shared/emailBranding';
const input = { email: 'recipient@example.test', name: 'Recipient', tier: 'enterprise' as const, expiresAt: null };
describe('Complimentary grant email confirmations', () => {
 it.each(['starter', 'professional', 'enterprise'] as const)('shows exact %s plan and zero subscription fee', tier => {
  const email = buildComplimentaryAccessEmail({ ...input, tier });
  expect(email.subject.toLowerCase()).toContain(tier);
  expect(email.html).toContain('$0/month while this grant is active');
  expect(email.html).toContain('No scheduled expiration');
  expect(email.html).toContain('may change or revoke');
 });
 it('includes approved logo, canonical account links and visible unsubscribe', () => {
  const email = buildComplimentaryAccessEmail(input);
  expect(email.html).toContain(EMAIL_LOGO_URL);
  expect(email.html).toContain('https://www.ologywood.com/workspace');
  expect(email.html).toContain('https://www.ologywood.com/settings');
  expect(email.html).toContain('unsubscribe?email=recipient%40example.test&type=subscription');
  expect(email.html).toContain('>Unsubscribe</a>');
 });
 it('does not promise free transactions, paid content or automatic renewal', () => {
  const email = buildComplimentaryAccessEmail(input);
  expect(email.html).toContain('Stripe processing, and fan purchases still apply');
  expect(email.html).toContain('does not automatically start a paid subscription');
  expect(email.html).not.toContain('Grant reason');
 });
 it('escapes names to prevent injected HTML', () => {
  const email = buildComplimentaryAccessEmail({ ...input, name: '<img src=x onerror="alert(1)"> & Name' });
  expect(email.html).toContain('&lt;img');
  expect(email.html).not.toContain('<img src=x');
 });
 it('uses a clearly identified UTC expiry rather than ambiguous server local dates', () => {
  const email = buildComplimentaryAccessEmail({ ...input, expiresAt: new Date('2030-01-31T18:00:00Z') });
  expect(email.html).toContain('January 31, 2030');
  expect(email.html).toContain('UTC');
  expect(email.html).not.toContain('No scheduled expiration');
 });
 it('rejects invalid expiry and unsupported tier', () => {
  expect(() => buildComplimentaryAccessEmail({ ...input, expiresAt: new Date('invalid') })).toThrow();
  expect(() => buildComplimentaryAccessEmail({ ...input, tier: 'admin' as any })).toThrow();
 });
 it('reports provider acceptance but does not claim inbox delivery', async () => {
  vi.mocked(sendEmail).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  expect(await sendComplimentaryAccessEmail(input)).toBe(true);
  expect(await sendComplimentaryAccessEmail(input)).toBe(false);
  expect(sendEmail).toHaveBeenCalledWith(buildComplimentaryAccessEmail(input), { timeoutMs: 8_000 });
 });
 it('requires explicit send flag and deduplicates attempts while respecting opt-outs and current access', () => {
  const script = readFileSync(new URL('../scripts/send-complimentary-access-emails.ts', import.meta.url), 'utf8');
  const delivery = readFileSync(new URL('./services/complimentaryAccessEmailDelivery.ts', import.meta.url), 'utf8');
  expect(script).toContain("process.argv.includes('--send')");
  expect(script).toContain('notifyComplimentaryGrant(owner, target.userId, null, !sending)');
  expect(delivery).toContain("row.frequency === 'never' || row.unsubscribedAt");
  expect(delivery).toContain("getGrantStatus(row) !== 'active'");
  expect(delivery).toContain('hasPotentiallyBillingSubscription');
  expect(delivery).toContain('skipped_already_attempted');
  expect(delivery).toContain('FOR UPDATE');
  expect(delivery).toContain('await conn.commit()');
 });
});
