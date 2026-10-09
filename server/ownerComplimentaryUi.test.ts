import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const readFile = (filePath: string) =>
  fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf-8');

describe('Complimentary owner entitlement UI', () => {
  const subscriptionManagement = readFile('client/src/components/SubscriptionManagement.tsx');
  const pricing = readFile('client/src/pages/Pricing.tsx');

  it('renders a dedicated active Enterprise owner access card without paid subscription actions', () => {
    expect(subscriptionManagement).toContain('Enterprise — Complimentary Owner Access');
    expect(subscriptionManagement).toContain('$0/month');
    expect(subscriptionManagement).toContain('No renewal or expiry applies to this owner entitlement.');
    expect(subscriptionManagement).toContain('All Enterprise plan features are available, including unlimited releases.');
    expect(subscriptionManagement).toContain('does not waive marketplace transaction fees, Stripe processing fees, or fan purchase charges');
  });

  it('does not block complimentary owner access on live Stripe status and preserves billing-record context', () => {
    expect(subscriptionManagement).toContain('enabled: !subLoading && !isComplimentary');
    expect(subscriptionManagement).toContain('subscription?.billingStatus');
    expect(subscriptionManagement).toContain('does not change existing Stripe billing records, invoices, or subscriptions');
  });

  it('shows the owner pricing banner and prevents checkout for complimentary access', () => {
    expect(pricing).toContain('Enterprise — Complimentary Owner Access');
    expect(pricing).toContain('$0 subscription fee — no payment needed. Regular plan pricing remains available to everyone else.');
    expect(pricing).toContain("if (isComplimentary) {");
    expect(pricing).toContain('Complimentary Enterprise access is active');
    expect(pricing).toContain('View complimentary Enterprise access');
  });
});
