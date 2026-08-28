import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { EMAIL_LOGO_ALT, EMAIL_LOGO_URL, getEmailLogoImage } from '../shared/emailBranding';

const projectRoot = path.resolve(__dirname, '..');

const emailImplementationFiles = [
  'server/email.ts',
  'server/email/emailTemplate.ts',
  'server/emailService.ts',
  'server/handlers/creditExpiration.ts',
  'server/referralEmails.ts',
  'server/routers/admin.ts',
  'server/routers/release.ts',
  'server/services/artistUpdateService.ts',
  'server/services/emailBrandingTemplates.ts',
  'server/services/fanNotificationService.ts',
  'server/templates/bookingConfirmationEmail.html',
  'server/webhooks/stripe.ts',
];

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

describe('approved OlogyWood email logo', () => {
  it('uses the permanent HTTPS asset with explicit email-safe dimensions and alt text', () => {
    const markup = getEmailLogoImage({ size: 88, marginBottom: 12 });

    expect(EMAIL_LOGO_URL).toBe('https://www.ologywood.com/manus-storage/ologywood-email-logo-2026_0b47af54.png');
    expect(markup).toContain(`src="${EMAIL_LOGO_URL}"`);
    expect(markup).toContain(`alt="${EMAIL_LOGO_ALT}"`);
    expect(markup).toContain('width="88"');
    expect(markup).toContain('height="88"');
  });

  it('removes every retired logo source from email implementation files', () => {
    const retiredPatterns = [
      'ymRJKMwaOWmPOCjV.png',
      'https://www.ologywood.com/logo-lg.png',
      'https://www.ologywood.com/logo-sm.png',
      'cid:ologywood-logo',
      'logo-icon.png',
    ];

    for (const file of emailImplementationFiles) {
      const source = read(file);
      for (const retiredPattern of retiredPatterns) {
        expect(source, `${file} still contains ${retiredPattern}`).not.toContain(retiredPattern);
      }
    }
  });

  it('routes every email implementation through the approved shared asset', () => {
    for (const file of emailImplementationFiles) {
      const source = read(file);
      expect(
        source.includes('getEmailLogoImage')
          || source.includes('EMAIL_LOGO_URL')
          || source.includes('{{logoUrl}}'),
        `${file} does not reference the approved shared email logo`,
      ).toBe(true);
    }
  });

  it('preserves unsubscribe controls in fan, referral, subscription, and release-purchase emails', () => {
    for (const file of [
      'server/email.ts',
      'server/referralEmails.ts',
      'server/services/artistUpdateService.ts',
      'server/services/fanNotificationService.ts',
      'server/webhooks/stripe.ts',
    ]) {
      expect(read(file), `${file} must retain an unsubscribe control`).toMatch(/unsubscribe/i);
    }
  });
});
