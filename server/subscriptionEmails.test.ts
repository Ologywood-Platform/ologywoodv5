import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readFile(relativePath: string): string {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8');
}

describe('Subscription Email Templates (email.ts)', () => {
  const src = readFile('server/email.ts');

  describe('subscriptionEmailWrapper', () => {
    it('defines a branded email wrapper function', () => {
      expect(src).toContain('function subscriptionEmailWrapper(content: string, recipientEmail: string)');
    });

    it('includes the Ologywood branded header with gradient', () => {
      expect(src).toContain('linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%)');
    });

    it('includes the Ologywood logo image', () => {
      expect(src).toContain('ymRJKMwaOWmPOCjV.png');
    });

    it('includes tagline in header', () => {
      expect(src).toContain('Where Artists Meet Opportunities');
    });

    it('includes unsubscribe link for CAN-SPAM compliance', () => {
      expect(src).toContain('Unsubscribe');
      expect(src).toContain('unsubscribeUrl');
      expect(src).toContain('type=subscription');
    });

    it('includes manage preferences link', () => {
      expect(src).toContain('Manage preferences');
      expect(src).toContain('/settings');
    });

    it('includes privacy policy link', () => {
      expect(src).toContain('Privacy Policy');
      expect(src).toContain('/privacy');
    });

    it('includes copyright notice', () => {
      expect(src).toContain('2026 Ologywood');
    });
  });

  describe('sendSubscriptionCreatedEmail (upgrade)', () => {
    it('exports the function', () => {
      expect(src).toContain('export async function sendSubscriptionCreatedEmail');
    });

    it('accepts planName parameter', () => {
      expect(src).toContain('planName?: string');
    });

    it('accepts planPrice parameter', () => {
      expect(src).toContain('planPrice?: string');
    });

    it('accepts features array parameter', () => {
      expect(src).toContain('features?: string[]');
    });

    it('accepts trialEndDate parameter', () => {
      expect(src).toContain('trialEndDate?: string');
    });

    it('displays the plan name in the email', () => {
      expect(src).toContain('${displayPlan}');
      expect(src).toContain('subscription is now active');
    });

    it('displays the plan price', () => {
      expect(src).toContain('${displayPrice}');
    });

    it('renders feature list items', () => {
      expect(src).toContain('displayFeatures.map');
      expect(src).toContain("<li>${f}</li>");
    });

    it('shows trial info when trialEndDate is provided', () => {
      expect(src).toContain('14-day free trial active');
      expect(src).toContain("won't be charged until");
    });

    it('includes a dashboard CTA button', () => {
      expect(src).toContain('/dashboard');
      expect(src).toContain('Go to Dashboard');
    });

    it('uses branded wrapper', () => {
      // The function should call subscriptionEmailWrapper
      expect(src).toContain('subscriptionEmailWrapper(content, artistEmail)');
    });

    it('includes plan name in subject line', () => {
      expect(src).toContain('Welcome to Ologywood ${displayPlan}');
    });

    it('defaults to Professional Plan when no plan specified', () => {
      expect(src).toContain("const displayPlan = planName || 'Professional Plan'");
    });

    it('defaults to $29/month when no price specified', () => {
      expect(src).toContain("const displayPrice = planPrice || '$29/month'");
    });
  });

  describe('sendSubscriptionCanceledEmail', () => {
    it('exports the function', () => {
      expect(src).toContain('export async function sendSubscriptionCanceledEmail');
    });

    it('accepts planName parameter', () => {
      // Check the function signature includes planName
      const fnStart = src.indexOf('sendSubscriptionCanceledEmail');
      const fnBlock = src.substring(fnStart, fnStart + 500);
      expect(fnBlock).toContain('planName');
    });

    it('shows the plan name in cancellation message', () => {
      expect(src).toContain('has been cancelled');
    });

    it('explains what happens next', () => {
      expect(src).toContain('What happens next');
    });

    it('shows access-until date', () => {
      expect(src).toContain('full access to all features until');
      expect(src).toContain('${endDate}');
    });

    it('explains account reverts to Free plan', () => {
      expect(src).toContain('revert to the Free plan');
    });

    it('reassures data is preserved', () => {
      expect(src).toContain('data will be preserved');
    });

    it('includes reactivation CTA button', () => {
      expect(src).toContain('Reactivate Subscription');
    });

    it('includes contact page link for feedback', () => {
      expect(src).toContain('/contact');
    });

    it('uses red-themed styling for cancellation', () => {
      expect(src).toContain('#ef4444');
      expect(src).toContain('#fef2f2');
    });

    it('uses branded wrapper', () => {
      const fnStart = src.indexOf('sendSubscriptionCanceledEmail');
      const fnBlock = src.substring(fnStart, fnStart + 3000);
      expect(fnBlock).toContain('subscriptionEmailWrapper');
    });
  });

  describe('sendSubscriptionReactivatedEmail', () => {
    it('exports the function', () => {
      expect(src).toContain('export async function sendSubscriptionReactivatedEmail');
    });

    it('accepts planName parameter', () => {
      const fnStart = src.indexOf('sendSubscriptionReactivatedEmail');
      const fnBlock = src.substring(fnStart, fnStart + 500);
      expect(fnBlock).toContain('planName');
    });

    it('accepts planPrice parameter', () => {
      const fnStart = src.indexOf('sendSubscriptionReactivatedEmail');
      const fnBlock = src.substring(fnStart, fnStart + 500);
      expect(fnBlock).toContain('planPrice');
    });

    it('accepts nextBillingDate parameter', () => {
      const fnStart = src.indexOf('sendSubscriptionReactivatedEmail');
      const fnBlock = src.substring(fnStart, fnStart + 500);
      expect(fnBlock).toContain('nextBillingDate');
    });

    it('shows subscription restored confirmation', () => {
      expect(src).toContain('Subscription Restored');
    });

    it('shows plan name and price', () => {
      expect(src).toContain('${displayPlan}');
      expect(src).toContain('${displayPrice}');
    });

    it('shows status as Active', () => {
      expect(src).toContain('Status: <strong>Active</strong>');
    });

    it('shows next billing date when available', () => {
      expect(src).toContain('Next billing date');
      expect(src).toContain('${nextBillingDate}');
    });

    it('includes welcome back message', () => {
      expect(src).toContain('Welcome back');
    });

    it('includes dashboard CTA button', () => {
      const fnStart = src.indexOf('sendSubscriptionReactivatedEmail');
      const fnBlock = src.substring(fnStart, fnStart + 3000);
      expect(fnBlock).toContain('/dashboard');
      expect(fnBlock).toContain('Go to Dashboard');
    });

    it('uses green-themed styling for reactivation', () => {
      expect(src).toContain('#22c55e');
      expect(src).toContain('#f0fdf4');
    });

    it('uses branded wrapper', () => {
      const fnStart = src.indexOf('sendSubscriptionReactivatedEmail');
      const fnBlock = src.substring(fnStart, fnStart + 3000);
      expect(fnBlock).toContain('subscriptionEmailWrapper');
    });

    it('includes plan name in subject line', () => {
      expect(src).toContain('Welcome Back! Your ${displayPlan} Is Active Again');
    });
  });
});

describe('Stripe Webhook Integration (webhooks/stripe.ts)', () => {
  const src = readFile('server/webhooks/stripe.ts');

  describe('handleSubscriptionUpdate - upgrade email', () => {
    it('imports SUBSCRIPTION_PRODUCTS for plan detection', () => {
      expect(src).toContain("import('../../shared/products')");
      expect(src).toContain('SUBSCRIPTION_PRODUCTS');
    });

    it('detects Starter plan by lookup key', () => {
      expect(src).toContain('SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey');
    });

    it('detects Starter plan by price amount', () => {
      expect(src).toContain('SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly');
    });

    it('passes planName to sendSubscriptionCreatedEmail', () => {
      expect(src).toContain('planName,');
      expect(src).toContain('planPrice,');
      expect(src).toContain('features,');
    });

    it('passes features array from product config', () => {
      expect(src).toContain('SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.features');
      expect(src).toContain('SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.features');
    });
  });

  describe('handleSubscriptionDeleted - cancel email', () => {
    it('determines plan name from price data', () => {
      const fnStart = src.lastIndexOf('handleSubscriptionDeleted');
      const fnBlock = src.substring(fnStart, fnStart + 3000);
      expect(fnBlock).toContain('SUBSCRIPTION_PRODUCTS');
      expect(fnBlock).toContain('planName');
    });

    it('passes planName to sendSubscriptionCanceledEmail', () => {
      expect(src).toContain('planName,');
      expect(src).toContain('sendSubscriptionCanceledEmail');
    });
  });
});

describe('tRPC Subscription Endpoints (routers.ts)', () => {
  const src = readFile('server/routers.ts');

  describe('cancel endpoint - email integration', () => {
    it('imports getSubscriptionStatus for plan detection', () => {
      const cancelStart = src.indexOf('cancel: protectedProcedure');
      const cancelBlock = src.substring(cancelStart, cancelStart + 2000);
      expect(cancelBlock).toContain('getSubscriptionStatus');
    });

    it('imports SUBSCRIPTION_PRODUCTS for plan name lookup', () => {
      const cancelStart = src.indexOf('cancel: protectedProcedure');
      const cancelBlock = src.substring(cancelStart, cancelStart + 2000);
      expect(cancelBlock).toContain('SUBSCRIPTION_PRODUCTS');
    });

    it('determines plan name from priceAmount', () => {
      const cancelStart = src.indexOf('cancel: protectedProcedure');
      const cancelBlock = src.substring(cancelStart, cancelStart + 2000);
      expect(cancelBlock).toContain('status.priceAmount');
    });

    it('calls sendSubscriptionCanceledEmail', () => {
      const cancelStart = src.indexOf('cancel: protectedProcedure');
      const cancelBlock = src.substring(cancelStart, cancelStart + 2000);
      expect(cancelBlock).toContain('sendSubscriptionCanceledEmail');
    });

    it('sends email with planName and endDate', () => {
      const cancelStart = src.indexOf('cancel: protectedProcedure');
      const cancelBlock = src.substring(cancelStart, cancelStart + 2000);
      expect(cancelBlock).toContain('planName');
      expect(cancelBlock).toContain('endDate');
    });

    it('handles email sending errors gracefully with catch', () => {
      const cancelStart = src.indexOf('cancel: protectedProcedure');
      const cancelBlock = src.substring(cancelStart, cancelStart + 2000);
      expect(cancelBlock).toContain('.catch(err =>');
    });

    it('does not block the response on email failure', () => {
      // Email is fire-and-forget (no await on the catch chain)
      const cancelStart = src.indexOf('cancel: protectedProcedure');
      const cancelBlock = src.substring(cancelStart, cancelStart + 2000);
      expect(cancelBlock).toContain('email.sendSubscriptionCanceledEmail({');
      expect(cancelBlock).toContain("}).catch(");
    });
  });

  describe('reactivate endpoint - email integration', () => {
    it('imports getSubscriptionStatus for plan detection', () => {
      const reactivateStart = src.indexOf('reactivate: protectedProcedure');
      const reactivateBlock = src.substring(reactivateStart, reactivateStart + 2000);
      expect(reactivateBlock).toContain('getSubscriptionStatus');
    });

    it('imports SUBSCRIPTION_PRODUCTS for plan name lookup', () => {
      const reactivateStart = src.indexOf('reactivate: protectedProcedure');
      const reactivateBlock = src.substring(reactivateStart, reactivateStart + 2000);
      expect(reactivateBlock).toContain('SUBSCRIPTION_PRODUCTS');
    });

    it('calls sendSubscriptionReactivatedEmail', () => {
      const reactivateStart = src.indexOf('reactivate: protectedProcedure');
      const reactivateBlock = src.substring(reactivateStart, reactivateStart + 2000);
      expect(reactivateBlock).toContain('sendSubscriptionReactivatedEmail');
    });

    it('sends email with planName, planPrice, and nextBillingDate', () => {
      const reactivateStart = src.indexOf('reactivate: protectedProcedure');
      const reactivateBlock = src.substring(reactivateStart, reactivateStart + 2000);
      expect(reactivateBlock).toContain('planName');
      expect(reactivateBlock).toContain('planPrice');
      expect(reactivateBlock).toContain('nextBillingDate');
    });

    it('handles email sending errors gracefully with catch', () => {
      const reactivateStart = src.indexOf('reactivate: protectedProcedure');
      const reactivateBlock = src.substring(reactivateStart, reactivateStart + 2000);
      expect(reactivateBlock).toContain('.catch(err =>');
    });
  });
});

describe('Stripe getSubscriptionStatus (stripe.ts)', () => {
  const src = readFile('server/stripe.ts');

  it('returns priceAmount from subscription items', () => {
    expect(src).toContain('priceAmount: priceItem?.unit_amount');
  });

  it('returns lookupKey from subscription items', () => {
    expect(src).toContain('lookupKey: priceItem?.lookup_key');
  });

  it('extracts price item from subscription data', () => {
    expect(src).toContain("subData.items?.data?.[0]?.price");
  });
});
