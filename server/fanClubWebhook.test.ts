import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  syncFanClub: vi.fn(),
  retrieveSubscription: vi.fn(),
}));

vi.mock('./services/stripeWebhookMode', () => ({
  verifyStripeWebhookEvent: mocks.verify,
  getStripeClientForWebhookMode: vi.fn(() => ({
    subscriptions: { retrieve: mocks.retrieveSubscription },
  })),
}));
vi.mock('./services/fanClubMembershipService', () => ({
  syncFanClubMembershipFromSubscription: mocks.syncFanClub,
}));
vi.mock('./services/contentReleaseCommerceService', () => ({
  fulfillContentReleaseCheckout: vi.fn(),
  fulfillContentReleasePaymentIntent: vi.fn(),
  refundContentReleaseCharge: vi.fn(),
}));
vi.mock('./services/ologyLiveCheckoutService', () => ({
  handleOlogyLiveCheckout: vi.fn(),
  handleOlogyLiveCheckoutTerminal: vi.fn(),
  handleOlogyLiveCheckoutRefund: vi.fn(),
}));
vi.mock('./db', () => ({}));
vi.mock('./email', () => ({}));

import {
  createTicketCheckoutSessionFromPaymentIntent,
  handleStripeWebhook,
} from './webhooks/stripe';

function response() {
  const res: any = { status: vi.fn(), send: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.send.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

const request = () => ({
  headers: { 'stripe-signature': 'synthetic-signature' },
  body: Buffer.from('synthetic signed fixture'),
} as any);

const subscription = {
  id: 'sub_fan_club_fixture',
  status: 'active',
  metadata: { type: 'fan_club_subscription', fanUserId: '7', talentUserId: '22', tierId: '4' },
  current_period_end: 1_800_000_000,
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.syncFanClub.mockResolvedValue({ synced: true, membershipId: 9, status: 'active' });
  mocks.retrieveSubscription.mockResolvedValue(subscription);
});

describe('Fan Club Stripe fulfillment', () => {
  it('retrieves the paid Checkout subscription and syncs a membership', async () => {
    const session = {
      id: 'cs_fan_club_fixture',
      payment_status: 'paid',
      subscription: subscription.id,
      metadata: subscription.metadata,
    };
    mocks.verify.mockReturnValue({
      event: { id: 'evt_fan_club_checkout', type: 'checkout.session.completed', data: { object: session } },
      mode: 'test',
    });

    const res = response();
    await handleStripeWebhook(request(), res);

    expect(mocks.retrieveSubscription).toHaveBeenCalledWith(subscription.id);
    expect(mocks.syncFanClub).toHaveBeenCalledWith(subscription, session.metadata);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('does not create membership access for an unpaid Checkout session', async () => {
    const session = {
      id: 'cs_fan_club_unpaid_fixture',
      payment_status: 'unpaid',
      subscription: subscription.id,
      metadata: subscription.metadata,
    };
    mocks.verify.mockReturnValue({
      event: { id: 'evt_fan_club_unpaid', type: 'checkout.session.completed', data: { object: session } },
      mode: 'test',
    });

    const res = response();
    await handleStripeWebhook(request(), res);

    expect(mocks.retrieveSubscription).not.toHaveBeenCalled();
    expect(mocks.syncFanClub).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('syncs later subscription lifecycle events without touching ordinary creator billing', async () => {
    mocks.verify.mockReturnValue({
      event: { id: 'evt_fan_club_update', type: 'customer.subscription.updated', data: { object: subscription } },
      mode: 'test',
    });

    const res = response();
    await handleStripeWebhook(request(), res);

    expect(mocks.syncFanClub).toHaveBeenCalledWith(subscription);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });
});

describe('Ticket PaymentIntent fallback metadata', () => {
  it('maps a ticket PaymentIntent into the existing idempotent ticket handler shape', () => {
    const session = createTicketCheckoutSessionFromPaymentIntent({
      id: 'pi_ticket_fixture',
      amount: 1_099,
      amount_received: 1_099,
      metadata: {
        type: 'ticket_purchase',
        orderId: '31',
        orderNumber: 'OLG-UNIT-31',
        eventId: '12',
        items: JSON.stringify([{ tierId: 3, quantity: 1 }]),
      },
    } as any);
    expect(session).toMatchObject({
      id: 'payment_intent:pi_ticket_fixture',
      payment_intent: 'pi_ticket_fixture',
      amount_total: 1_099,
      metadata: { type: 'ticket_purchase', orderId: '31', eventId: '12' },
    });
  });

  it('ignores unrelated PaymentIntents', () => {
    expect(createTicketCheckoutSessionFromPaymentIntent({
      id: 'pi_merch_fixture',
      amount: 500,
      metadata: { type: 'merch_purchase', orderId: '8' },
    } as any)).toBeNull();
  });
});
