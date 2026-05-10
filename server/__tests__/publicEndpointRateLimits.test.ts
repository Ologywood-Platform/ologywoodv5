import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'path';
import { readFileSync } from 'fs';

const serverDir = join(__dirname, '..');
const routersDir = join(serverDir, 'routers');

describe('Rate Limiting on Public Endpoints', () => {
  describe('Rate Limiter Utility', () => {
    it('exports all pre-configured limiters', () => {
      const content = readFileSync(join(serverDir, 'utils', 'rateLimiter.ts'), 'utf-8');
      expect(content).toContain('export const contactFormLimiter');
      expect(content).toContain('export const newsletterLimiter');
      expect(content).toContain('export const signupLimiter');
      expect(content).toContain('export const loginLimiter');
      expect(content).toContain('export const resendEmailLimiter');
      expect(content).toContain('export const emailTestingLimiter');
    });

    it('all limiters use 15-minute windows', () => {
      const content = readFileSync(join(serverDir, 'utils', 'rateLimiter.ts'), 'utf-8');
      // Each limiter should use 15 * 60 * 1000
      const limiterBlocks = content.split('new RateLimiter(');
      // First block is before any limiter, so skip it
      for (let i = 1; i < limiterBlocks.length; i++) {
        expect(limiterBlocks[i]).toContain('15 * 60 * 1000');
      }
    });

    it('contactFormLimiter allows 3 requests', () => {
      const content = readFileSync(join(serverDir, 'utils', 'rateLimiter.ts'), 'utf-8');
      const contactSection = content.split('contactFormLimiter')[1].split('});')[0];
      expect(contactSection).toContain('maxRequests: 3');
    });

    it('newsletterLimiter allows 5 requests', () => {
      const content = readFileSync(join(serverDir, 'utils', 'rateLimiter.ts'), 'utf-8');
      const section = content.split('newsletterLimiter')[1].split('});')[0];
      expect(section).toContain('maxRequests: 5');
    });

    it('signupLimiter allows 5 requests', () => {
      const content = readFileSync(join(serverDir, 'utils', 'rateLimiter.ts'), 'utf-8');
      const section = content.split('signupLimiter')[1].split('});')[0];
      expect(section).toContain('maxRequests: 5');
    });

    it('loginLimiter allows 20 requests', () => {
      const content = readFileSync(join(serverDir, 'utils', 'rateLimiter.ts'), 'utf-8');
      const section = content.split('loginLimiter')[1].split('});')[0];
      expect(section).toContain('maxRequests: 20');
    });

    it('resendEmailLimiter allows 3 requests', () => {
      const content = readFileSync(join(serverDir, 'utils', 'rateLimiter.ts'), 'utf-8');
      const section = content.split('resendEmailLimiter')[1].split('});')[0];
      expect(section).toContain('maxRequests: 3');
    });

    it('emailTestingLimiter allows 5 requests', () => {
      const content = readFileSync(join(serverDir, 'utils', 'rateLimiter.ts'), 'utf-8');
      const section = content.split('emailTestingLimiter')[1].split('});')[0];
      expect(section).toContain('maxRequests: 5');
    });
  });

  describe('Newsletter Subscribe Endpoint', () => {
    const routersContent = readFileSync(join(serverDir, 'routers.ts'), 'utf-8');

    it('imports newsletterLimiter', () => {
      expect(routersContent).toContain("import { newsletterLimiter } from \"./utils/rateLimiter\"");
    });

    it('applies IP-based rate limiting', () => {
      expect(routersContent).toContain('newsletterLimiter.check(`ip:${clientIp}`)');
    });

    it('applies email-based rate limiting', () => {
      expect(routersContent).toContain('newsletterLimiter.check(`email:${input.email.toLowerCase()}`)');
    });

    it('throws TOO_MANY_REQUESTS when rate limited', () => {
      expect(routersContent).toContain("code: 'TOO_MANY_REQUESTS'");
    });

    it('provides user-friendly retry message', () => {
      expect(routersContent).toContain('Too many subscription attempts');
    });
  });

  describe('Auth Signup Endpoint', () => {
    const authContent = readFileSync(join(routersDir, 'auth.ts'), 'utf-8');

    it('imports signupLimiter', () => {
      expect(authContent).toContain('signupLimiter');
    });

    it('applies IP-based rate limiting to signup', () => {
      expect(authContent).toContain('signupLimiter.check(`ip:${getClientIp(ctx)}`)');
    });

    it('throws TOO_MANY_REQUESTS on signup rate limit', () => {
      const signupSection = authContent.split('// Email/Password Signup')[1]?.split('// Email/Password Login')[0];
      expect(signupSection).toContain("code: 'TOO_MANY_REQUESTS'");
      expect(signupSection).toContain('Too many signup attempts');
    });
  });

  describe('Auth Login Endpoint', () => {
    const authContent = readFileSync(join(routersDir, 'auth.ts'), 'utf-8');

    it('imports loginLimiter', () => {
      expect(authContent).toContain('loginLimiter');
    });

    it('applies IP-based rate limiting to login', () => {
      expect(authContent).toContain('loginLimiter.check(`ip:${getClientIp(ctx)}`)');
    });

    it('throws TOO_MANY_REQUESTS on login rate limit', () => {
      const loginSection = authContent.split('// Email/Password Login')[1]?.split('// Check if email exists')[0];
      expect(loginSection).toContain("code: 'TOO_MANY_REQUESTS'");
      expect(loginSection).toContain('Too many login attempts');
    });
  });

  describe('Auth Resend Confirmation Email Endpoint', () => {
    const authContent = readFileSync(join(routersDir, 'auth.ts'), 'utf-8');

    it('imports resendEmailLimiter', () => {
      expect(authContent).toContain('resendEmailLimiter');
    });

    it('applies IP-based rate limiting', () => {
      expect(authContent).toContain('resendEmailLimiter.check(`ip:${getClientIp(ctx)}`)');
    });

    it('applies email-based rate limiting', () => {
      expect(authContent).toContain('resendEmailLimiter.check(`email:${input.email.toLowerCase()}`)');
    });

    it('provides user-friendly retry messages', () => {
      expect(authContent).toContain('Too many resend attempts');
      expect(authContent).toContain('Confirmation email was already sent recently');
    });
  });

  describe('Email Testing Endpoints', () => {
    const emailTestingContent = readFileSync(join(routersDir, 'emailTesting.ts'), 'utf-8');

    it('imports emailTestingLimiter', () => {
      expect(emailTestingContent).toContain('emailTestingLimiter');
    });

    it('applies rate limiting to testAllTemplates', () => {
      const section = emailTestingContent.split('testAllTemplates')[1]?.split('testTemplate')[0];
      expect(section).toContain('emailTestingLimiter.check');
    });

    it('applies rate limiting to testTemplate', () => {
      const section = emailTestingContent.split('testTemplate: publicProcedure')[1];
      expect(section).toContain('emailTestingLimiter.check');
    });

    it('throws TOO_MANY_REQUESTS when rate limited', () => {
      expect(emailTestingContent).toContain("code: 'TOO_MANY_REQUESTS'");
      expect(emailTestingContent).toContain('Too many email test requests');
    });
  });

  describe('Contact Form Endpoint', () => {
    const contactContent = readFileSync(join(routersDir, 'contact.ts'), 'utf-8');

    it('imports contactFormLimiter', () => {
      expect(contactContent).toContain('contactFormLimiter');
    });

    it('applies IP-based rate limiting', () => {
      expect(contactContent).toContain('contactFormLimiter.check');
    });

    it('has honeypot spam protection', () => {
      // The honeypot uses a hidden 'website' field that bots fill in
      expect(contactContent).toContain('Honeypot');
      expect(contactContent).toContain('website');
    });
  });

  describe('All public mutations have rate limiting', () => {
    it('newsletter subscribe is rate limited', () => {
      const content = readFileSync(join(serverDir, 'routers.ts'), 'utf-8');
      const newsletterSection = content.split('newsletter: router({')[1]?.split('admin:')[0];
      expect(newsletterSection).toContain('newsletterLimiter.check');
    });

    it('auth signup is rate limited', () => {
      const content = readFileSync(join(routersDir, 'auth.ts'), 'utf-8');
      expect(content).toContain('signupLimiter.check');
    });

    it('auth login is rate limited', () => {
      const content = readFileSync(join(routersDir, 'auth.ts'), 'utf-8');
      expect(content).toContain('loginLimiter.check');
    });

    it('auth resend confirmation is rate limited', () => {
      const content = readFileSync(join(routersDir, 'auth.ts'), 'utf-8');
      expect(content).toContain('resendEmailLimiter.check');
    });

    it('email testing is rate limited', () => {
      const content = readFileSync(join(routersDir, 'emailTesting.ts'), 'utf-8');
      expect(content).toContain('emailTestingLimiter.check');
    });

    it('contact form is rate limited', () => {
      const content = readFileSync(join(routersDir, 'contact.ts'), 'utf-8');
      expect(content).toContain('contactFormLimiter.check');
    });
  });

  describe('Rate limit error messages are user-friendly', () => {
    it('all rate limit messages include retry time in minutes', () => {
      const files = [
        readFileSync(join(serverDir, 'routers.ts'), 'utf-8'),
        readFileSync(join(routersDir, 'auth.ts'), 'utf-8'),
        readFileSync(join(routersDir, 'emailTesting.ts'), 'utf-8'),
        readFileSync(join(routersDir, 'contact.ts'), 'utf-8'),
      ];

      for (const content of files) {
        // Every file with rate limiting should calculate retry minutes
        if (content.includes('retryAfterMs')) {
          expect(content).toContain('retryMinutes');
          expect(content).toContain('Math.ceil');
        }
      }
    });

    it('no rate limit messages expose internal details', () => {
      const files = [
        readFileSync(join(serverDir, 'routers.ts'), 'utf-8'),
        readFileSync(join(routersDir, 'auth.ts'), 'utf-8'),
        readFileSync(join(routersDir, 'emailTesting.ts'), 'utf-8'),
        readFileSync(join(routersDir, 'contact.ts'), 'utf-8'),
      ];

      for (const content of files) {
        // Should not expose IP addresses or internal keys in error messages
        const rateLimitMessages = content.match(/message:.*Too many/g) || [];
        for (const msg of rateLimitMessages) {
          expect(msg).not.toContain('ip:');
          expect(msg).not.toContain('email:');
        }
      }
    });
  });
});
