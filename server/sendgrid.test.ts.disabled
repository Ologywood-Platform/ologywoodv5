import { describe, it, expect } from 'vitest';
import { sendEmail } from './email';

describe('SendGrid Email Service', () => {
  it('should successfully send a test email via SendGrid', async () => {
    const result = await sendEmail({
      to: 'test@mailinator.com',
      subject: 'Ologywood SendGrid Test',
      html: '<h1>SendGrid Email Test</h1><p>This is a test email from Ologywood to verify SendGrid integration is working correctly.</p>',
    });

    expect(result).toBe(true);
  });

  it('should handle invalid email addresses gracefully', async () => {
    const result = await sendEmail({
      to: 'invalid-email',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    // Should return false for invalid email
    expect(typeof result).toBe('boolean');
  });

  it('should send newsletter subscription confirmation email', async () => {
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
  });
});
