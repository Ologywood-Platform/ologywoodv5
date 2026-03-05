import { describe, it, expect } from 'vitest';

describe('SendGrid From Email Configuration', () => {
  it('should have SENDGRID_FROM_EMAIL set to support@ologywood.com', () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).toBe('support@ologywood.com');
  });

  it('should not use the old info@ologywood.com address', () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    expect(fromEmail).not.toBe('info@ologywood.com');
  });

  it('should have SENDGRID_API_KEY configured', () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.startsWith('SG.')).toBe(true);
  });
});
