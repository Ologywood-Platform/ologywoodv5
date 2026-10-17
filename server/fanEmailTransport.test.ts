import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('./_core/env', () => ({ ENV: { baseUrl: 'https://www.ologywood.com', sendgridApiKey: 'synthetic-test-key', sendgridFromEmail: 'platform@example.test' } }));
import { sendEmail } from './email';
import { fanEmailDeliveryOptions } from './services/fanEmailFormatting';

const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset().mockResolvedValue({ ok: true, status: 202 }); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());
const payload = { to: 'fan@example.test', subject: 'Synthetic update', html: '<p>Fixture only</p>' };

describe('Fan email transport headers and bounds', () => {
  it('builds correct scoped RFC8058 headers and passes the bounded transport signal', async () => {
    const options = fanEmailDeliveryOptions('https://www.ologywood.com/unsubscribe?fanToken=signed-proof');
    expect(await sendEmail(payload, options)).toBe(true);
    const init = fetchMock.mock.calls[0][1]; const body = JSON.parse(init.body);
    expect(body.headers).toEqual({ 'List-Unsubscribe': '<https://www.ologywood.com/api/email/unsubscribe?fanToken=signed-proof>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });
    expect(init.signal).toBeInstanceOf(AbortSignal); expect(init.signal.aborted).toBe(false);
    expect(body.personalizations).toEqual([{ to: [{ email: 'fan@example.test' }] }]);
  });
  it('does not add one-click authority to legacy transactional email headers', async () => {
    await sendEmail(payload);
    const headers = JSON.parse(fetchMock.mock.calls[0][1].body).headers;
    expect(headers).not.toHaveProperty('List-Unsubscribe-Post');
  });
  it.each([
    'https://attacker.example/api/email/unsubscribe?fanToken=proof',
    'https://www.ologywood.com/other?fanToken=proof',
    'https://www.ologywood.com/api/email/unsubscribe?email=fan@example.test',
    'https://www.ologywood.com/api/email/unsubscribe?fanToken=proof\r\nHeader:bad',
  ])('rejects arbitrary/malformed unsubscribe destinations %j before the provider', async unsubscribeUrl => {
    expect(await sendEmail(payload, { timeoutMs: 8000, unsubscribeUrl, oneClickUnsubscribe: true })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('does not report provider rejection as accepted', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'Synthetic rejection' });
    expect(await sendEmail(payload, fanEmailDeliveryOptions('https://www.ologywood.com/unsubscribe?fanToken=proof'))).toBe(false);
  });
  it('handles a bounded transport abort without claiming delivery', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('Synthetic timeout'), { name: 'TimeoutError' }));
    expect(await sendEmail(payload, fanEmailDeliveryOptions('https://www.ologywood.com/unsubscribe?fanToken=proof'))).toBe(false);
  });
});
