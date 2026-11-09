import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/merchOrders.ts'), 'utf8');

describe('merch order security boundaries', () => {
  it('restricts seller order management to artist and venue accounts', () => {
    expect(source).toContain('const sellerProcedure = protectedProcedure.use');
    expect(source).toContain("ctx.user.role !== 'artist' && ctx.user.role !== 'venue'");
    expect(source).toContain("message: 'Seller access required'");
    expect(source).toContain('sellerOrders: sellerProcedure');
    expect(source).toContain('updateFulfillment: sellerProcedure');
    expect(source).toContain('eq(merchOrders.sellerUserId, ctx.user.id)');
  });

  it('keeps fulfillment identifiers and seller-controlled fields bounded and strict', () => {
    expect(source).toContain('orderId: z.number().int().safe().positive()');
    expect(source).toContain('trackingNumber: z.string().trim().max(255).optional()');
    expect(source).toContain('trackingCarrier: z.string().trim().max(100).optional()');
    expect(source).toContain('trackingUrl: z.string().url().max(2048).optional().or(z.literal(\'\'))');
    expect(source).toContain('pickupNotes: z.string().trim().max(1000).optional()');
    expect(source).toContain('fulfillmentNotes: z.string().trim().max(1000).optional()');
    expect(source).toContain('}).strict())');
  });

  it('does not expose raw database or email exceptions', () => {
    expect(source).toContain("message: 'Unable to load checkout result.'");
    expect(source).toContain("message: 'Unable to load your merch orders.'");
    expect(source).toContain("message: 'Unable to load seller orders.'");
    expect(source).toContain("{ kind: error instanceof Error ? error.name : 'UnknownError' }");
    expect(source).not.toContain("console.error('[Merch Orders] Failed to send status email:', error)");
  });
});
