import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('./_core/env', () => ({ ENV: {
  sendgridApiKey: 'SG.offline-unit-fixture', sendgridFromEmail: 'support@ologywood.com', baseUrl: 'https://www.ologywood.com',
} }));
import { sendEmail } from './email';

describe('SendGrid Email Service (mocked provider)', () => {
  beforeEach(() => { mocks.fetch.mockReset(); vi.stubGlobal('fetch', mocks.fetch); });
  afterAll(() => vi.unstubAllGlobals());
  it('accepts SendGrid HTTP 202 without sending a real email', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, status: 202, text: vi.fn() });
    expect(await sendEmail({ to: 'buyer@example.test', subject: 'Unit confirmation', html: '<p>Fixture</p>' })).toBe(true);
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.fetch.mock.calls[0][0]).toBe('https://api.sendgrid.com/v3/mail/send');
  });
  it('handles provider rejection without reporting fake success', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 400, text: vi.fn().mockResolvedValue('invalid email') });
    expect(await sendEmail({ to: 'invalid-email', subject: 'Fixture', html: '<p>Fixture</p>' })).toBe(false);
  });
  it('constructs the correct newsletter recipient and subject', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, status: 202, text: vi.fn() });
    expect(await sendEmail({ to: 'newsletter@example.test', subject: 'Welcome to OlogyWood Newsletter!', html: '<p>Fixture welcome</p>' })).toBe(true);
    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body.personalizations[0].to[0].email).toBe('newsletter@example.test');
    expect(body.subject).toBe('Welcome to OlogyWood Newsletter!');
    expect(body.from.email).toBe('support@ologywood.com');
  });
  it('returns false on an uncertain network failure rather than inventing delivery', async () => {
    mocks.fetch.mockRejectedValue(new Error('offline fixture failure'));
    expect(await sendEmail({ to: 'buyer@example.test', subject: 'Fixture', html: '<p>Fixture</p>' })).toBe(false);
  });
});
