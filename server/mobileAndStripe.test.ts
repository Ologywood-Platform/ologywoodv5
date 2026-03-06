import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for:
 * 1. Mobile hamburger menu in SiteHeader
 * 2. Stripe subscription checkout wired from Pricing page
 * 3. Products configuration with Starter + Professional tiers
 */

const readFile = (filePath: string) =>
  fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf-8');

describe('Mobile Hamburger Menu (SiteHeader)', () => {
  const content = readFile('client/src/components/SiteHeader.tsx');

  it('should import Menu and X icons from lucide-react', () => {
    expect(content).toContain('Menu');
    expect(content).toMatch(/import.*X.*from 'lucide-react'/);
  });

  it('should have mobileOpen state', () => {
    expect(content).toContain('mobileOpen');
    expect(content).toContain('setMobileOpen');
  });

  it('should have a hamburger toggle button visible on mobile only', () => {
    expect(content).toContain('md:hidden');
    expect(content).toContain('aria-label');
    expect(content).toContain('aria-expanded');
  });

  it('should hide desktop nav on mobile screens', () => {
    expect(content).toContain('hidden md:flex');
  });

  it('should render mobile dropdown menu when open', () => {
    expect(content).toContain('md:hidden');
    expect(content).toContain('mobileOpen');
  });

  it('should close menu on outside click', () => {
    expect(content).toContain('mousedown');
    expect(content).toContain('menuRef');
  });

  it('should close menu on route change', () => {
    // location dependency in useEffect that calls setMobileOpen(false)
    expect(content).toContain('setMobileOpen(false)');
    expect(content).toMatch(/useEffect.*\n.*setMobileOpen\(false\)/);
  });

  it('should include Browse, Events, Pricing links in mobile menu', () => {
    expect(content).toContain('href="/browse"');
    expect(content).toContain('href="/events"');
    expect(content).toContain('href="/pricing"');
  });

  it('should include Following link in mobile menu for authenticated users', () => {
    expect(content).toContain('href="/following"');
  });

  it('should include Dashboard link in mobile menu for authenticated users', () => {
    expect(content).toContain('getDashboardUrl');
  });

  it('should include Log In button in mobile menu for unauthenticated users', () => {
    expect(content).toContain('Log In');
  });

  it('should show full Ologywood text on all screens (not abbreviated)', () => {
    // Desktop and mobile should both show "Ologywood"
    expect(content).toContain('<span>Ologywood</span>');
  });

  it('should have closeMobile callback for link clicks', () => {
    expect(content).toContain('closeMobile');
    expect(content).toContain('onClick={closeMobile}');
  });
});

describe('Subscription Products Configuration', () => {
  const content = readFile('shared/products.ts');

  it('should define ARTIST_STARTER product', () => {
    expect(content).toContain('ARTIST_STARTER');
  });

  it('should define ARTIST_PROFESSIONAL product', () => {
    expect(content).toContain('ARTIST_PROFESSIONAL');
  });

  it('should set Starter price to $9 (900 cents)', () => {
    expect(content).toContain('priceMonthly: 900');
  });

  it('should set Professional price to $29 (2900 cents)', () => {
    expect(content).toContain('priceMonthly: 2900');
  });

  it('should have lookup keys for Stripe price matching', () => {
    expect(content).toContain('artist_starter_monthly');
    expect(content).toContain('artist_professional_monthly');
  });

  it('should define PLAN_SLUG_MAP for URL-friendly plan selection', () => {
    expect(content).toContain('PLAN_SLUG_MAP');
    expect(content).toContain("starter: 'ARTIST_STARTER'");
    expect(content).toContain("professional: 'ARTIST_PROFESSIONAL'");
  });

  it('should include a legacy ARTIST_BASIC alias', () => {
    expect(content).toContain('ARTIST_BASIC');
  });

  it('should set 14-day trial only on Professional plan', () => {
    // Starter has trialDays: 0
    const starterBlock = content.split('ARTIST_PROFESSIONAL')[0];
    expect(starterBlock).toContain('trialDays: 0');
    // Professional has trialDays: 14
    expect(content).toContain('trialDays: 14');
  });
});

describe('Stripe Checkout (server/stripe.ts)', () => {
  const content = readFile('server/stripe.ts');

  it('should import PLAN_SLUG_MAP from shared products', () => {
    expect(content).toContain('PLAN_SLUG_MAP');
  });

  it('should accept a plan parameter in createSubscriptionCheckoutSession', () => {
    expect(content).toContain('plan?: string');
  });

  it('should resolve product from plan slug', () => {
    expect(content).toContain('planSlug');
    expect(content).toContain('PLAN_SLUG_MAP');
  });

  it('should have a resolvePrice helper that creates products if needed', () => {
    expect(content).toContain('resolvePrice');
    expect(content).toContain('products.create');
    expect(content).toContain('prices.create');
  });

  it('should only add trial days when product specifies them', () => {
    expect(content).toContain('product.trialDays > 0');
  });

  it('should include plan in metadata for webhook processing', () => {
    expect(content).toContain("plan: productKey");
  });
});

describe('Subscription Router (plan parameter)', () => {
  const content = readFile('server/routers.ts');

  it('should accept plan enum in createCheckoutSession input', () => {
    expect(content).toContain("plan: z.enum(['starter', 'professional'])");
  });

  it('should pass plan to createSubscriptionCheckoutSession', () => {
    expect(content).toContain('plan: input.plan');
  });

  it('should default plan to professional', () => {
    expect(content).toContain(".default('professional')");
  });
});

describe('Pricing Page (Stripe integration)', () => {
  const content = readFile('client/src/pages/Pricing.tsx');

  it('should import useAuth for authentication check', () => {
    expect(content).toContain('useAuth');
  });

  it('should import trpc for API calls', () => {
    expect(content).toContain('trpc');
  });

  it('should call subscription.createCheckoutSession mutation', () => {
    expect(content).toContain('trpc.subscription.createCheckoutSession');
    expect(content).toContain('useMutation');
  });

  it('should pass plan slug to checkout mutation', () => {
    expect(content).toContain('plan: tier.planSlug');
  });

  it('should open checkout URL in new tab', () => {
    expect(content).toContain("window.open(data.checkoutUrl, '_blank')");
  });

  it('should show loading state on button during checkout', () => {
    expect(content).toContain('loadingPlan');
    expect(content).toContain('Loader2');
    expect(content).toContain('Redirecting...');
  });

  it('should redirect unauthenticated users to get-started', () => {
    expect(content).toContain('!isAuthenticated');
    expect(content).toContain('navigate("/get-started")');
  });

  it('should show toast notification for sign-in requirement', () => {
    expect(content).toContain('Sign in required');
  });

  it('should set success URL to dashboard with subscription=success', () => {
    expect(content).toContain('subscription=success');
  });

  it('should set cancel URL back to pricing page', () => {
    expect(content).toContain("cancelUrl: `${origin}/pricing`");
  });

  it('should show 14-day trial note on Professional plan', () => {
    expect(content).toContain('14-day free trial included');
  });

  it('should have planSlug on Starter and Professional tiers', () => {
    expect(content).toContain('planSlug: "starter"');
    expect(content).toContain('planSlug: "professional"');
  });

  it('should NOT have planSlug on Free tier', () => {
    // Free tier block should not have planSlug
    const freeBlock = content.split('name: "Starter"')[0];
    // Only the Free tier is before Starter
    const freeFeatures = freeBlock.split('name: "Free"')[1] || '';
    expect(freeFeatures).not.toContain('planSlug');
  });
});
