import { describe, it, expect } from 'vitest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import { sendEmail } from './email';

describe('SendGrid Email Service', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('should successfully send a test email via SendGrid', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 202, text: vi.fn() });
    const result = await sendEmail({
      to: 'test@mailinator.com',
      subject: 'Ologywood SendGrid Test',
      html: '<h1>SendGrid Email Test</h1><p>This is a test email from Ologywood to verify SendGrid integration is working correctly.</p>',
    });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.sendgrid.com/v3/mail/send');
  });

  it('should handle invalid email addresses gracefully', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: vi.fn().mockResolvedValue('invalid email') });
    const result = await sendEmail({
      to: 'invalid-email',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result).toBe(false);
  });

  it('should send newsletter subscription confirmation email', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 202, text: vi.fn() });
    const result = await sendEmail({
      to: 'newsletter-test@mailinator.com',
      subject: 'Welcome to Ologywood Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to Ologywood!</h1>
          <p>Thank you for subscribing to our newsletter.</p>
        </div>
      `,
    });

    expect(result).toBe(true);
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body.personalizations[0].to[0].email).toBe('newsletter-test@mailinator.com');
    expect(body.subject).toBe('Welcome to Ologywood Newsletter!');
  });
});
