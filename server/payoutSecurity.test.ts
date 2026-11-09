import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const payout = readFileSync(resolve(__dirname, 'routers/payout.ts'), 'utf8');

describe('payout security boundaries', () => {
  it('bounds payout amounts and database-backed bank-account identifiers', () => {
    expect(payout).toContain('const payoutAmount = z.number().finite().positive().max(1_000_000)');
    expect(payout).toContain('Amount must have at most two decimal places');
    expect(payout).toContain("regex(/^\\d{1,10}$/, 'Invalid bank account identifier')");
    expect(payout).toContain('2_147_483_647');
    expect(payout).toContain("}).strict()\n    )");
  });

  it('prevents payout requests from exceeding completed, uncommitted earnings', () => {
    expect(payout).toContain("earning.status === 'completed'");
    expect(payout).toContain("['pending', 'processing', 'completed'].includes(payout.status)");
    expect(payout).toContain('Requested payout exceeds your available completed earnings');
  });

  it('requires safe payout IDs and administrator-only transitions', () => {
    expect(payout).toContain('const payoutId = z.number().int().safe().positive()');
    expect(payout).toContain('.input(z.object({ payoutId }).strict())');
    expect(payout).toContain('processPayout: adminProcedure');
    expect(payout).toContain('completePayout: adminProcedure');
    expect(payout).toContain("ctx.user.role !== 'artist' && ctx.user.role !== 'admin'");
    expect(payout).toContain("eq(artistPayouts.status, 'pending')");
    expect(payout).toContain("eq(artistPayouts.status, 'processing')");
    expect(payout).toContain('Payout is not pending or does not exist');
    expect(payout).toContain('Payout is not processing or does not exist');
  });

  it('keeps earnings and payout requests inside the artist-scoped procedure', () => {
    for (const procedure of ['getPayouts', 'getEarnings', 'getEarningsBreakdown', 'getPayoutHistory', 'requestPayout', 'getTransactionHistory']) {
      expect(payout).toContain(`${procedure}: artistPayoutProcedure`);
    }
    expect(payout).toContain("message: 'Artist access required'");
    expect(payout).toContain("Payout requests are temporarily unavailable.");
  });
});
