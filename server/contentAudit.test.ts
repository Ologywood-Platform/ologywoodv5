import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Content Audit Tests
 * Verifies that public-facing pages accurately reflect actual platform features and pricing.
 */

describe('Platform Content Audit', () => {
  // Helper to read a file's content
  const readFile = (filePath: string) => {
    return fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf-8');
  };

  describe('Pricing Page', () => {
    const content = readFile('client/src/pages/Pricing.tsx');

    it('should show correct tier names: Free, Starter, Professional', () => {
      expect(content).toContain('name: "Free"');
      expect(content).toContain('name: "Starter"');
      expect(content).toContain('name: "Professional"');
    });

    it('should NOT show Enterprise tier', () => {
      expect(content).not.toContain('name: "Enterprise"');
    });

    it('should show correct prices: $0, $9, $29', () => {
      expect(content).toContain('price: "$0"');
      expect(content).toContain('price: "$9"');
      expect(content).toContain('price: "$29"');
    });

    it('should NOT show incorrect $9.99 price', () => {
      expect(content).not.toContain('$9.99');
    });

    it('should mention 2 booking requests for free tier', () => {
      expect(content).toContain('2 booking requests per month');
    });

    it('should NOT claim 5 booking requests for free tier', () => {
      expect(content).not.toContain('5 booking');
    });

    it('should mention Rider Builder feature', () => {
      expect(content).toContain('Rider Builder');
    });

    it('should mention contracts and e-signatures', () => {
      expect(content).toContain('Contract management');
      expect(content).toContain('e-signatures');
    });

    it('should mention Send Update / fan email feature', () => {
      expect(content).toContain('Send Update');
    });

    it('should show 14-day trial only for Professional plan', () => {
      expect(content).toContain('14-day free trial included');
      // Should only appear once (Professional plan)
      const matches = content.match(/14-day free trial/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe('Pricing aligns with backend tiers', () => {
    const pricingService = readFile('server/services/pricingTierService.ts');

    it('backend has free tier at $0 with 2 bookings/month', () => {
      expect(pricingService).toContain('price: 0');
      expect(pricingService).toContain('bookingsPerMonth: 2');
    });

    it('backend has starter tier at $9', () => {
      expect(pricingService).toContain('starter:');
      expect(pricingService).toContain('price: 9');
    });

    it('backend has professional tier at $29', () => {
      expect(pricingService).toContain('professional:');
      expect(pricingService).toContain('price: 29');
    });

    it('free tier should NOT have riderBuilder access', () => {
      // The free tier block should have riderBuilder: false
      const freeBlock = pricingService.split('starter:')[0];
      expect(freeBlock).toContain('riderBuilder: false');
    });
  });

  describe('Homepage', () => {
    const content = readFile('client/src/pages/Home.tsx');

    it('should mention Riders & Contracts feature', () => {
      expect(content).toContain('Riders & Contracts');
    });

    it('should mention Events & Availability feature', () => {
      expect(content).toContain('Events & Availability');
    });

    it('should mention Follow & Stay Connected feature', () => {
      expect(content).toContain('Follow & Stay Connected');
    });

    it('should mention Secure Payments feature', () => {
      expect(content).toContain('Secure Payments');
    });

    it('should mention Direct Messaging feature', () => {
      expect(content).toContain('Direct Messaging');
    });

    it('should mention e-signatures', () => {
      expect(content).toContain('e-signatures');
    });

    it('should use SiteHeader component', () => {
      expect(content).toContain('SiteHeader');
    });
  });

  describe('Footer', () => {
    const content = readFile('client/src/components/Footer.tsx');

    it('should link to /cookies not /cookie-policy', () => {
      expect(content).not.toContain("'/cookie-policy'");
      expect(content).toContain("'/cookies'");
    });

    it('should include Events link', () => {
      expect(content).toContain("'Events'");
      expect(content).toContain("'/events'");
    });

    it('should include Pricing link', () => {
      expect(content).toContain("'Pricing'");
      expect(content).toContain("'/pricing'");
    });

    it('should include Riders link for artists', () => {
      expect(content).toContain("'Riders'");
      expect(content).toContain("'/riders'");
    });

    it('should include Earnings link for artists', () => {
      expect(content).toContain("'Earnings'");
      expect(content).toContain("'/earnings'");
    });

    it('should include Invoices link for venues', () => {
      expect(content).toContain("'Invoices'");
      expect(content).toContain("'/venue-invoices'");
    });
  });

  describe('Help Page', () => {
    const content = readFile('client/src/pages/Help.tsx');

    it('should use correct phone number', () => {
      expect(content).toContain('+1 (678) 525-0891');
      expect(content).not.toContain('(555) 123-4567');
    });

    it('should use correct email addresses', () => {
      expect(content).toContain('support@ologywood.com');
      expect(content).not.toContain('info@ologywood.com');
    });

    it('should have help articles for Following feature', () => {
      expect(content).toContain('How do I follow an artist?');
    });

    it('should have help articles for Send Update feature', () => {
      expect(content).toContain('Send Update');
    });

    it('should have help articles for Events', () => {
      expect(content).toContain('How do events work on Ologywood?');
    });

    it('should have help articles for Contracts and e-signatures', () => {
      expect(content).toContain('contracts and e-signatures');
    });

    it('should have help articles for Subscription tiers', () => {
      expect(content).toContain('subscription tiers');
    });

    it('should have help articles for Availability calendar', () => {
      expect(content).toContain('availability calendar');
    });
  });

  describe('FAQ Page', () => {
    const content = readFile('client/src/pages/FAQ.tsx');

    it('should include Following question', () => {
      expect(content).toContain('How do I follow an artist?');
    });

    it('should include Rider question', () => {
      expect(content).toContain('What is a rider?');
    });

    it('should include Contracts question', () => {
      expect(content).toContain('contracts and e-signatures');
    });

    it('should include Events question', () => {
      expect(content).toContain('How do events work?');
    });

    it('should include Subscription plans question', () => {
      expect(content).toContain('What subscription plans are available?');
    });

    it('should mention correct pricing in FAQ answers', () => {
      expect(content).toContain('$9/month');
      expect(content).toContain('$29/month');
      expect(content).toContain('2 bookings/month');
    });

    it('should mention Send Update in fan updates answer', () => {
      expect(content).toContain('Send Update');
    });

    it('should use SiteHeader component', () => {
      expect(content).toContain('SiteHeader');
    });
  });

  describe('How It Works Page', () => {
    const content = readFile('client/src/pages/HowItWorks.tsx');

    it('should link CTA to /get-started not /onboarding', () => {
      expect(content).toContain('href="/get-started"');
      expect(content).not.toContain('href="/onboarding"');
    });

    it('should include Grow Your Fan Base step for artists', () => {
      expect(content).toContain('Grow Your Fan Base');
    });

    it('should mention following and email updates', () => {
      expect(content).toContain('Fans can follow your profile');
      expect(content).toContain('Send branded email updates');
    });
  });

  describe('Trust Badges', () => {
    const content = readFile('client/src/components/TrustBadges.tsx');

    it('should NOT claim 24/7 support', () => {
      expect(content).not.toContain("24/7");
    });

    it('should say Dedicated Support instead', () => {
      expect(content).toContain('Dedicated Support');
    });

    it('should NOT claim thousands of users', () => {
      expect(content).not.toContain('Thousands');
      expect(content).not.toContain('thousands');
    });
  });

  describe('Role Selection (Get Started)', () => {
    const content = readFile('client/src/pages/RoleSelection.tsx');

    it('should NOT claim rider templates for free tier artist card', () => {
      expect(content).not.toContain('Save rider templates for technical requirements');
    });

    it('should mention fan base growth for artists', () => {
      expect(content).toContain('Sell music & grow your fan base');
    });

    it('should mention events for venues', () => {
      expect(content).toContain('Manage events & contracts');
    });

    it('should include fan role option', () => {
      expect(content).toContain("I'm a Fan");
      expect(content).toContain('Follow your favorite artists');
    });
  });
});
