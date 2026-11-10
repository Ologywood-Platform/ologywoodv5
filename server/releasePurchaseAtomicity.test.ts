import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./db', () => ({ getDb: vi.fn() }));
import { commitReleasePurchase, validatePaidReleaseCheckout } from './services/releasePurchaseFulfillmentService';
const data = {
  releaseId: 1, buyerEmail: 'buyer@example.test', buyerUserId: null,
  stripeCheckoutSessionId: 'cs_test_fixture', amountPaidCents: 200,
  platformFeeCents: 2, artistNetCents: 198,
};
const receipt = { ...data, id: 9 } as any;
function fixture(existing: any = undefined, failCounter = false) {
  const reads = [[{ id: 1 }], existing ? [existing] : [], [receipt]];
  const locks = vi.fn();
  const insert = vi.fn().mockResolvedValue([{ insertId: 9 }]);
  const update = vi.fn().mockImplementation(async () => {
    if (failCounter) throw new Error('counter unavailable');
    return [{ affectedRows: 1 }];
  });
  const tx = {
    select: vi.fn(() => {
      const rows = reads.shift() || [];
      const chain: any = { from: () => chain, where: () => chain, limit: () => chain, for: () => { locks(); return chain; }, then: (ok: any, fail: any) => Promise.resolve(rows).then(ok, fail) };
      return chain;
    }),
    insert: vi.fn(() => ({ values: insert })),
    update: vi.fn(() => ({ set: () => ({ where: update }) })),
  };
  const rollback = vi.fn();
  const database = { transaction: vi.fn(async (work: any) => { try { return await work(tx); } catch (e) { rollback(); throw e; } }) };
  return { database, tx, insert, update, locks, rollback };
}
describe('atomic release financial fulfillment', () => {
  it('locks receipt identity and commits receipt plus counters in one transaction', async () => {
    const f = fixture();
    await expect(commitReleasePurchase(data, f.database as any)).resolves.toEqual({ purchase: receipt, created: true });
    expect(f.database.transaction).toHaveBeenCalledTimes(1);
    expect(f.locks).toHaveBeenCalledTimes(2);
    expect(f.insert).toHaveBeenCalledWith(data);
    expect(f.update).toHaveBeenCalledTimes(1);
  });
  it('does not increment counters or create another receipt for a replay', async () => {
    const f = fixture(receipt);
    await expect(commitReleasePurchase(data, f.database as any)).resolves.toEqual({ purchase: receipt, created: false });
    expect(f.insert).not.toHaveBeenCalled();
    expect(f.update).not.toHaveBeenCalled();
  });
  it('aborts the transaction if counters cannot be persisted', async () => {
    const f = fixture(undefined, true);
    await expect(commitReleasePurchase(data, f.database as any)).rejects.toThrow('counter unavailable');
    expect(f.rollback).toHaveBeenCalledTimes(1);
  });
  it('refuses a reused checkout identity attached to another release', async () => {
    const f = fixture({ ...receipt, releaseId: 2 });
    await expect(commitReleasePurchase(data, f.database as any)).rejects.toThrow('identity mismatch');
    expect(f.insert).not.toHaveBeenCalled();
  });
});
describe('trusted music payment evidence', () => {
  const release = { id: 1, artistId: 3, priceInCents: 200, currency: 'usd', allowPayWhatYouWant: false };
  const session = { id: 'cs_test_fixture', mode: 'payment', payment_status: 'paid', payment_intent: 'pi_fixture', amount_total: 200, currency: 'usd', metadata: { type: 'release_purchase', releaseId: '1', artistId: '3' } } as any;
  it('accepts exact paid evidence', () => expect(validatePaidReleaseCheckout(session, release as any)).toBe(true));
  it.each([{ payment_status: 'unpaid' }, { amount_total: 199 }, { currency: 'eur' }, { id: 'payment_intent:pi_fixture' }, { metadata: { ...session.metadata, artistId: '9' } }])('rejects incorrect financial or identity evidence', change => {
    expect(validatePaidReleaseCheckout({ ...session, ...change }, release as any)).toBe(false);
  });
});
