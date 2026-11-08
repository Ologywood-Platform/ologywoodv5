import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Ticketing security boundaries', () => {
  it('uses safe bounded strict schemas for tier, purchase, promo, and transfer inputs', () => {
    const source = read('./routers/ticketing.ts');
    expect(source).toContain('eventId: z.number().int().safe().positive()');
    expect(source).toContain('price: z.number().int().min(0).max(10_000_000)');
    expect(source).toContain("items: z.array(z.object({");
    expect(source).toContain('}).strict()).min(1).max(20)');
    expect(source).toContain("ticketCode: z.string().trim().uuid()");
    expect(source).toContain("transferCode: z.string().trim().uuid()");
    expect(source).toContain("toEmail: z.string().trim().email().max(320)");
    expect(source).toContain("}).strict())");
  });

  it('does not use an untrusted request origin for Stripe return URLs', () => {
    const source = read('./routers/ticketing.ts');
    expect(source).toContain("import { trustedCheckoutOrigin } from '../services/trustedOrigin';");
    expect(source).toContain('const origin = trustedCheckoutOrigin(process.env.BASE_URL, (ctx.req as any)?.headers?.origin);');
    expect(source).not.toContain("const origin = (ctx.req as any)?.headers?.origin || process.env.BASE_URL");
  });

  it('party-scopes transfer history and does not spread private transfer rows publicly', () => {
    const source = read('./routers/ticketing.ts');
    expect(source).toContain("You can only view transfers for your own tickets");
    expect(source).toContain('if (!order || order.buyerUserId !== ctx.user.id)');
    expect(source).toContain('fromEmail: transfer.fromEmail');
    expect(source).not.toContain('...transfer,');
  });
});
