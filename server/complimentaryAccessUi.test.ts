import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const readFile = (filePath: string) =>
  fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf-8');

describe('Account-specific complimentary access UI', () => {
  const adminDashboard = readFile('client/src/pages/AdminDashboard.tsx');
  const adminAccessDialog = readFile('client/src/components/AdminComplimentaryAccess.tsx');
  const subscriptionManagement = readFile('client/src/components/SubscriptionManagement.tsx');
  const pricing = readFile('client/src/pages/Pricing.tsx');

  it('gates the Users-tab plan access column using the independent secure capability query', () => {
    expect(adminDashboard).toContain('complimentaryAccess.capabilities.useQuery');
    expect(adminDashboard).toContain('canManageComplimentaryAccess');
    expect(adminDashboard).toContain('Plan access');
    expect(adminDashboard).toContain('Enterprise — Owner');
    expect(adminDashboard).toContain('AdminComplimentaryAccess');
  });

  it('defers inspection until a single selected user is opened and supplies a guarded review flow', () => {
    expect(adminAccessDialog).toContain('enabled: canManage');
    expect(adminAccessDialog).toContain('complimentaryAccess.inspect.useQuery');
    expect(adminAccessDialog).toContain('expectedRevision: reviewExpectedRevision');
    expect(adminAccessDialog).toContain('billingAcknowledged: true');
    expect(adminAccessDialog).toContain('I understand this does not cancel Stripe billing or waive transaction fees.');
    expect(adminAccessDialog).toContain('Confirm replace');
    expect(adminAccessDialog).toContain('Confirm revoke');
    expect(adminAccessDialog).toContain('Audit history');
    expect(adminAccessDialog).toContain('CONFLICT');
    expect(adminAccessDialog).toContain('max-h-[90vh]');
    expect(adminAccessDialog).toContain('reviewExpectedRevision');
    expect(adminAccessDialog).toContain("Date.UTC(2038, 0, 1)");
    expect(adminAccessDialog).toContain('overlayClassName="z-[70]"');
    expect(adminAccessDialog).toContain('z-[71] flex max-h');
  });

  it('uses the server-authoritative billing blocker and invalidates entitlement-dependent data after writes', () => {
    expect(adminAccessDialog).toContain('hasBlockingStripeSubscription');
    expect(adminAccessDialog).toContain('blocksComplimentary === true');
    expect(adminAccessDialog).toContain('Active, period-end or unverified cancelled Stripe billing blocks grants');
    expect(adminAccessDialog).toContain('GRANT_BILLING_NOTICE');
    expect(adminAccessDialog).toContain('utils.pricing.getCurrentTier.invalidate()');
    expect(adminAccessDialog).toContain('utils.subscription.getMy.invalidate()');
    expect(adminAccessDialog).toContain('utils.admin.getUsers.invalidate()');
  });

  it('renders recipient complimentary grants using their actual tier and expiry without paid controls', () => {
    expect(subscriptionManagement).toContain("accessSource === 'complimentary_grant'");
    expect(subscriptionManagement).toContain('complimentaryExpiresAt');
    expect(subscriptionManagement).toContain('Complimentary Access');
    expect(subscriptionManagement).toContain('This complimentary grant does not cancel existing Stripe billing');
    expect(subscriptionManagement).toContain('Standard role requirements and permissions still apply');
    expect(pricing).toContain("accessSource === 'complimentary_grant'");
    expect(pricing).toContain('complimentaryAccess={isComplimentary}');
    expect(pricing).toContain('Complimentary access active');
    expect(pricing).toContain('Your access expires');
  });

  it('preserves the existing owner-specific language', () => {
    expect(subscriptionManagement).toContain('Enterprise — Complimentary Owner Access');
    expect(pricing).toContain('Enterprise — Complimentary Owner Access');
    expect(pricing).toContain('View complimentary Enterprise access');
  });
});
