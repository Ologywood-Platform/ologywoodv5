import { randomBytes } from 'crypto';

export type MerchFulfillmentMethod = 'shipping' | 'pickup' | 'digital';

const allowedTransitions: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'ready_for_pickup', 'completed', 'cancelled'],
  shipped: ['completed'],
  ready_for_pickup: ['completed'],
  completed: [],
  cancelled: [],
  refunded: [],
};

export function calculateMerchOrderAmounts(params: {
  priceInCents: number;
  quantity: number;
  shippingAmountCents: number;
  fulfillmentMethod: MerchFulfillmentMethod;
  platformFeeRate?: number;
}) {
  const subtotalCents = params.priceInCents * params.quantity;
  const shippingCents = params.fulfillmentMethod === 'shipping' ? params.shippingAmountCents : 0;
  const totalCents = subtotalCents + shippingCents;
  const platformFeeCents = Math.max(1, Math.round(totalCents * (params.platformFeeRate ?? 0.01)));
  return {
    subtotalCents,
    shippingCents,
    totalCents,
    platformFeeCents,
    sellerNetCents: totalCents - platformFeeCents,
  };
}

export function getInvalidMerchVariant(
  variants: Array<{ name: string; options: string[] }>,
  selected: Record<string, string>,
) {
  return variants.find((variant) => {
    const value = selected[variant.name];
    return !value || !variant.options.includes(value);
  })?.name || null;
}

export function canTransitionMerchOrder(
  currentStatus: string,
  nextStatus: string,
  fulfillmentMethod: MerchFulfillmentMethod,
) {
  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) return false;
  if (nextStatus === 'shipped' && fulfillmentMethod !== 'shipping') return false;
  if (nextStatus === 'ready_for_pickup' && fulfillmentMethod !== 'pickup') return false;
  return true;
}

export function createMerchOrderNumber(now = new Date(), randomHex?: string) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomHex || randomBytes(3).toString('hex').toUpperCase();
  return `OWM-${date}-${suffix}`;
}

export function buildMerchOrderNotification(params: {
  orderNumber: string;
  buyerName: string;
  totalCents: number;
  fulfillmentMethod: MerchFulfillmentMethod;
  itemCount: number;
}) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.totalCents / 100);
  const fulfillment = params.fulfillmentMethod === 'pickup'
    ? 'pickup'
    : params.fulfillmentMethod === 'digital' ? 'digital' : 'shipping';
  const itemLabel = `${params.itemCount} item${params.itemCount === 1 ? '' : 's'}`;

  return {
    type: 'payment' as const,
    title: `New merch order ${params.orderNumber}`,
    message: params.fulfillmentMethod === 'digital'
      ? `${params.buyerName} purchased a digital book for ${amount} (${itemLabel}). Access is available after verified payment.`
      : `${params.buyerName} placed a ${fulfillment} order for ${amount} (${itemLabel}). Review and begin fulfillment.`,
    actionUrl: '/merch-orders',
  };
}
