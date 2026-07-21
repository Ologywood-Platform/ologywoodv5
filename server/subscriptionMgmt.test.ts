import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readComponent(relativePath: string): string {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8');
}

describe('Subscription Management Component', () => {
  const src = readComponent('client/src/components/SubscriptionManagement.tsx');

  describe('Component structure', () => {
    it('exports SubscriptionManagement function', () => {
      expect(src).toContain('export function SubscriptionManagement');
    });

    it('imports trpc for data fetching', () => {
      expect(src).toContain("import { trpc } from '@/lib/trpc'");
    });

    it('imports useToast for notifications', () => {
      expect(src).toContain("import { useToast } from '@/components/ErrorToast'");
    });
  });

  describe('Tier information', () => {
    it('defines all three tiers: free, starter, professional', () => {
      expect(src).toContain("free:");
      expect(src).toContain("starter:");
      expect(src).toContain("professional:");
    });

    it('shows correct labels for each tier', () => {
      expect(src).toContain("label: 'Free'");
      expect(src).toContain("label: 'Starter'");
      expect(src).toContain("label: 'Professional'");
    });

    it('includes tier descriptions', () => {
      expect(src).toContain('2 bookings/month');
      expect(src).toContain('Unlimited bookings');
      expect(src).toContain('contracts, analytics');
    });

    it('assigns distinct icons per tier', () => {
      expect(src).toContain('icon: Shield');
      expect(src).toContain('icon: Zap');
      expect(src).toContain('icon: Crown');
    });
  });

  describe('Subscription data fetching', () => {
    it('fetches local subscription via subscription.getMy', () => {
      expect(src).toContain('subscription').toContain('getMy');
    });

    it('fetches live Stripe status via subscription.getStatus', () => {
      expect(src).toContain('getStatus');
    });
  });

  describe('Plan display', () => {
    it('shows current plan name', () => {
      expect(src).toContain('Current Plan');
      expect(src).toContain('tierInfo.label');
    });

    it('shows subscription status with icons', () => {
      expect(src).toContain('Cancels at period end');
      expect(src).toContain('Trial');
      expect(src).toContain('Active');
    });

    it('shows billing period end date', () => {
      expect(src).toContain('Next billing');
      expect(src).toContain('Access until');
    });

    it('shows price per month', () => {
      expect(src).toContain("$9");
      expect(src).toContain("$29");
    });

    it('shows trial end date when trialing', () => {
      expect(src).toContain('Trial ends');
      expect(src).toContain('trialEnd');
    });
  });

  describe('Upgrade actions', () => {
    it('shows upgrade buttons for free tier', () => {
      expect(src).toContain("Starter");
      expect(src).toContain("Professional");
      expect(src).toContain("handleUpgrade('starter')");
      expect(src).toContain("handleUpgrade('professional')");
    });

    it('shows upgrade to Professional for starter tier', () => {
      expect(src).toContain("tier === 'starter'");
      expect(src).toContain('Professional');
      expect(src).toContain("handleUpgrade('professional')");
    });

    it('creates checkout session with correct plan param', () => {
      expect(src).toContain('checkoutMutation.mutate');
      expect(src).toContain("plan,");
    });

    it('opens checkout URL in new tab', () => {
      expect(src).toContain("window.open(data.checkoutUrl, '_blank')");
    });
  });

  describe('Cancel and reactivate', () => {
    it('has cancel subscription button for active paid plans', () => {
      expect(src).toContain('Cancel Subscription');
      expect(src).toContain('cancelMutation');
    });

    it('has reactivate button when cancelled at period end', () => {
      expect(src).toContain('Reactivate Subscription');
      expect(src).toContain('reactivateMutation');
    });

    it('shows success toast on cancel', () => {
      expect(src).toContain("'Subscription cancelled'");
    });

    it('shows success toast on reactivate', () => {
      expect(src).toContain("'Subscription reactivated'");
    });
  });

  describe('Navigation', () => {
    it('links to pricing page for plan comparison', () => {
      expect(src).toContain("'/pricing'");
      expect(src).toContain('Compare all plans');
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner while fetching', () => {
      expect(src).toContain('Loading subscription');
      expect(src).toContain('animate-spin');
    });

    it('disables buttons while action is in progress', () => {
      expect(src).toContain('disabled={actionLoading');
    });
  });
});

describe('ArtistDashboardV3 integration', () => {
  const src = readComponent('client/src/pages/ArtistDashboardV3.tsx');

  it('imports SubscriptionManagement component', () => {
    expect(src).toContain("import { SubscriptionManagement } from '@/components/SubscriptionManagement'");
  });

  it('renders SubscriptionManagement in the dashboard', () => {
    expect(src).toContain('<SubscriptionManagement />');
  });

  it('places SubscriptionManagement before FansSection', () => {
    const subIdx = src.indexOf('<SubscriptionManagement />');
    const fansIdx = src.indexOf('<FansSection');
    expect(subIdx).toBeGreaterThan(-1);
    expect(fansIdx).toBeGreaterThan(-1);
    expect(subIdx).toBeLessThan(fansIdx);
  });
});

describe('Mobile-Optimized Pricing Page', () => {
  const src = readComponent('client/src/pages/Pricing.tsx');

  describe('Carousel structure', () => {
    it('has separate desktop and mobile layouts', () => {
      expect(src).toContain('hidden md:grid');
      expect(src).toContain('md:hidden');
    });

    it('uses 3-column grid on desktop', () => {
      expect(src).toContain('md:grid-cols-3');
    });

    it('renders plan tab buttons for mobile', () => {
      // Tab buttons with plan names
      expect(src).toContain('tier.name');
      expect(src).toContain('goToSlide');
    });

    it('uses translateX for carousel sliding', () => {
      expect(src).toContain('translateX');
      expect(src).toContain('activeSlide');
    });

    it('has smooth transition animation', () => {
      expect(src).toContain('transition-transform');
      expect(src).toContain('duration-300');
    });
  });

  describe('Touch swipe support', () => {
    it('handles touch start event', () => {
      expect(src).toContain('onTouchStart');
      expect(src).toContain('handleTouchStart');
    });

    it('handles touch move event', () => {
      expect(src).toContain('onTouchMove');
      expect(src).toContain('handleTouchMove');
    });

    it('handles touch end event', () => {
      expect(src).toContain('onTouchEnd');
      expect(src).toContain('handleTouchEnd');
    });

    it('uses threshold for swipe detection', () => {
      expect(src).toContain('threshold');
      expect(src).toContain('touchDeltaX');
    });
  });

  describe('Navigation controls', () => {
    it('uses swipe-only navigation without arrow buttons', () => {
      expect(src).not.toContain('ChevronLeft');
      expect(src).not.toContain('ChevronRight');
      expect(src).not.toContain('Previous plan');
      expect(src).not.toContain('Next plan');
    });

    it('supports touch swipe gestures', () => {
      expect(src).toContain('onTouchStart');
      expect(src).toContain('onTouchMove');
      expect(src).toContain('onTouchEnd');
    });

    it('has dot indicators', () => {
      expect(src).toContain('rounded-full');
      expect(src).toContain('bg-indigo-600 w-6');
      expect(src).toContain('bg-gray-300');
    });

    it('shows swipe hint text', () => {
      expect(src).toContain('Swipe or tap tabs to compare plans');
    });
  });

  describe('Default state', () => {
    it('starts on Starter plan (index 1) as most popular', () => {
      expect(src).toContain('useState(1)');
    });

    it('highlights active tab with indigo background', () => {
      expect(src).toContain('bg-indigo-600 text-white shadow-md');
    });
  });

  describe('PricingCard component', () => {
    it('extracts PricingCard as a reusable component', () => {
      expect(src).toContain('function PricingCard');
    });

    it('renders badge for highlighted plans', () => {
      expect(src).toContain('tier.badge');
      expect(src).toContain('Most Popular');
    });

    it('renders feature list with check/x icons', () => {
      expect(src).toContain('feature.included');
      expect(src).toContain('text-green-600');
      expect(src).toContain('text-gray-300');
    });
  });
});
