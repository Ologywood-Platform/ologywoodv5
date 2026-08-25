import { describe, expect, it } from 'vitest';
import {
  buildMerchOrderNotification,
  calculateMerchOrderAmounts,
  canTransitionMerchOrder,
  createMerchOrderNumber,
  getInvalidMerchVariant,
} from './utils/merchCommerce';

describe('hybrid merch commerce rules', () => {
  it('calculates a one-percent platform fee and creator net for shipped orders', () => {
    expect(calculateMerchOrderAmounts({
      priceInCents: 2500,
      quantity: 2,
      shippingAmountCents: 500,
      fulfillmentMethod: 'shipping',
    })).toEqual({
      subtotalCents: 5000,
      shippingCents: 500,
      totalCents: 5500,
      platformFeeCents: 55,
      sellerNetCents: 5445,
    });
  });

  it('does not charge shipping on pickup orders', () => {
    const amounts = calculateMerchOrderAmounts({
      priceInCents: 2000,
      quantity: 1,
      shippingAmountCents: 800,
      fulfillmentMethod: 'pickup',
    });
    expect(amounts.shippingCents).toBe(0);
    expect(amounts.totalCents).toBe(2000);
  });

  it('rejects missing or invalid product variants', () => {
    const variants = [{ name: 'Size', options: ['S', 'M', 'L'] }];
    expect(getInvalidMerchVariant(variants, {})).toBe('Size');
    expect(getInvalidMerchVariant(variants, { Size: 'XL' })).toBe('Size');
    expect(getInvalidMerchVariant(variants, { Size: 'M' })).toBeNull();
  });

  it('allows only valid fulfillment transitions', () => {
    expect(canTransitionMerchOrder('new', 'confirmed', 'shipping')).toBe(true);
    expect(canTransitionMerchOrder('preparing', 'shipped', 'shipping')).toBe(true);
    expect(canTransitionMerchOrder('preparing', 'shipped', 'pickup')).toBe(false);
    expect(canTransitionMerchOrder('preparing', 'ready_for_pickup', 'pickup')).toBe(true);
    expect(canTransitionMerchOrder('completed', 'preparing', 'shipping')).toBe(false);
  });

  it('creates a stable human-readable order number format', () => {
    expect(createMerchOrderNumber(new Date('2026-08-25T12:00:00Z'), 'ABC123')).toBe('OWM-20260825-ABC123');
  });

  it('builds an actionable creator notification for a paid merch order', () => {
    expect(buildMerchOrderNotification({
      orderNumber: 'OWM-20260825-ABC123',
      buyerName: 'Jamie Fan',
      totalCents: 4799,
      fulfillmentMethod: 'shipping',
      itemCount: 2,
    })).toEqual({
      type: 'payment',
      title: 'New merch order OWM-20260825-ABC123',
      message: 'Jamie Fan placed a shipping order for $47.99 (2 items). Review and begin fulfillment.',
      actionUrl: '/merch-orders',
    });
  });

  it('uses pickup wording and singular item grammar in creator notifications', () => {
    const notification = buildMerchOrderNotification({
      orderNumber: 'OWM-20260825-DEF456',
      buyerName: 'Alex Fan',
      totalCents: 2000,
      fulfillmentMethod: 'pickup',
      itemCount: 1,
    });
    expect(notification.message).toContain('pickup order for $20.00 (1 item)');
    expect(notification.actionUrl).toBe('/merch-orders');
  });
});
