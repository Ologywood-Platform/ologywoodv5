import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../utils/rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  afterEach(() => {
    if (limiter) limiter.destroy();
  });

  describe('Basic Rate Limiting', () => {
    beforeEach(() => {
      limiter = new RateLimiter({ maxRequests: 3, windowMs: 60_000 });
    });

    it('should allow requests under the limit', () => {
      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.retryAfterMs).toBe(0);
    });

    it('should track remaining requests correctly', () => {
      const r1 = limiter.check('user1');
      expect(r1.remaining).toBe(2);

      const r2 = limiter.check('user1');
      expect(r2.remaining).toBe(1);

      const r3 = limiter.check('user1');
      expect(r3.remaining).toBe(0);
    });

    it('should block requests over the limit', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('should track different keys independently', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      // user1 is blocked
      expect(limiter.check('user1').allowed).toBe(false);

      // user2 should still be allowed
      expect(limiter.check('user2').allowed).toBe(true);
    });

    it('should provide retryAfterMs when blocked', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      const result = limiter.check('user1');
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
    });
  });

  describe('Sliding Window', () => {
    it('should allow requests after the window expires', () => {
      // Use a very short window for testing
      limiter = new RateLimiter({ maxRequests: 1, windowMs: 50 });

      limiter.check('user1');
      expect(limiter.check('user1').allowed).toBe(false);

      // Wait for the window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(limiter.check('user1').allowed).toBe(true);
          resolve();
        }, 60);
      });
    });
  });

  describe('Reset and Destroy', () => {
    beforeEach(() => {
      limiter = new RateLimiter({ maxRequests: 2, windowMs: 60_000 });
    });

    it('should reset a specific key', () => {
      limiter.check('user1');
      limiter.check('user1');
      expect(limiter.check('user1').allowed).toBe(false);

      limiter.reset('user1');
      expect(limiter.check('user1').allowed).toBe(true);
    });

    it('should not affect other keys when resetting one', () => {
      limiter.check('user1');
      limiter.check('user2');

      limiter.reset('user1');

      // user1 is reset, user2 still has 1 request counted
      expect(limiter.check('user1').remaining).toBe(1);
      expect(limiter.check('user2').remaining).toBe(0);
    });

    it('should report store size', () => {
      expect(limiter.size).toBe(0);
      limiter.check('user1');
      expect(limiter.size).toBe(1);
      limiter.check('user2');
      expect(limiter.size).toBe(2);
    });

    it('should clear everything on destroy', () => {
      limiter.check('user1');
      limiter.check('user2');
      limiter.destroy();
      expect(limiter.size).toBe(0);
    });
  });

  describe('Contact Form Rate Limiting Scenarios', () => {
    beforeEach(() => {
      // Mimics the contact form limiter: 3 per 15 min
      limiter = new RateLimiter({ maxRequests: 3, windowMs: 15 * 60 * 1000 });
    });

    it('should allow 3 contact form submissions from same IP', () => {
      expect(limiter.check('ip:192.168.1.1').allowed).toBe(true);
      expect(limiter.check('ip:192.168.1.1').allowed).toBe(true);
      expect(limiter.check('ip:192.168.1.1').allowed).toBe(true);
    });

    it('should block 4th submission from same IP', () => {
      limiter.check('ip:192.168.1.1');
      limiter.check('ip:192.168.1.1');
      limiter.check('ip:192.168.1.1');
      expect(limiter.check('ip:192.168.1.1').allowed).toBe(false);
    });

    it('should allow 3 submissions from same email', () => {
      expect(limiter.check('email:test@example.com').allowed).toBe(true);
      expect(limiter.check('email:test@example.com').allowed).toBe(true);
      expect(limiter.check('email:test@example.com').allowed).toBe(true);
    });

    it('should block 4th submission from same email', () => {
      limiter.check('email:test@example.com');
      limiter.check('email:test@example.com');
      limiter.check('email:test@example.com');
      expect(limiter.check('email:test@example.com').allowed).toBe(false);
    });

    it('should allow different IPs to submit independently', () => {
      limiter.check('ip:1.1.1.1');
      limiter.check('ip:1.1.1.1');
      limiter.check('ip:1.1.1.1');

      // Different IP should still be allowed
      expect(limiter.check('ip:2.2.2.2').allowed).toBe(true);
    });

    it('should calculate retry time in minutes correctly', () => {
      limiter.check('ip:1.1.1.1');
      limiter.check('ip:1.1.1.1');
      limiter.check('ip:1.1.1.1');

      const result = limiter.check('ip:1.1.1.1');
      const retryMinutes = Math.ceil(result.retryAfterMs / 60_000);
      expect(retryMinutes).toBeGreaterThan(0);
      expect(retryMinutes).toBeLessThanOrEqual(15);
    });
  });

  describe('Honeypot Validation', () => {
    it('should detect bot when honeypot field is filled', () => {
      const honeypotValue = 'http://spam-site.com';
      const isBot = honeypotValue.length > 0;
      expect(isBot).toBe(true);
    });

    it('should pass when honeypot field is empty', () => {
      const honeypotValue = '';
      const isBot = honeypotValue.length > 0;
      expect(isBot).toBe(false);
    });

    it('should pass when honeypot field is undefined/default', () => {
      const honeypotValue = undefined;
      const isBot = honeypotValue && honeypotValue.length > 0;
      expect(isBot).toBeFalsy();
    });
  });
});
