import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  createEduStripeGateway,
  createSqlEduBillingRepository,
  prepareEduDiscountCheckout,
  recordEduSubscriptionActivation,
  reconcileEduBillingLifecycle,
  resolveEduNoticeDelivery,
  runEduLifecycleBatch,
  type EduBillingAccount,
  type EduBillingDependencies,
  type EduBillingRepository,
  type EduBillingVerification,
  type EduCheckout,
  type EduCoupon,
  type EduNotice,
  type EduSubscription,
} from "./services/eduBillingService";
import { ensureEduBillingSchema } from "./services/eduBillingSchemaService";

const date = (value: string) => new Date(value);
const day = 86_400_000;
function fixture() {
  let now = date("2026-01-01T00:00:00.000Z");
  let row: EduBillingVerification = {
    id: 7,
    userId: 42,
    revision: 1,
    status: "approved",
    verifiedUntil: date("2027-01-01T00:00:00.000Z"),
    graceUntil: date("2027-01-31T00:00:00.000Z"),
    checkoutSessionId: null,
    stripeCouponId: null,
    stripeSubscriptionId: null,
    billingMode: null,
    billingVerificationRevision: null,
    renewalNoticeSentAt: null,
    expiryNoticeSentAt: null,
    discountEndsAt: null,
    billingReconcileAfter: null,
  };
  const account: EduBillingAccount = {
    email: "student@example.test",
    stripeSubscriptionId: null,
  };
  let latestApprovalRevision = 1;
  let failSave = false;
  const noticeStates = new Map<string, string>();
  const notices: EduNotice[] = [];
  const coupons = new Map<string, EduCoupon>();
  const checkouts = new Map<string, EduCheckout>();
  const subscriptions = new Map<string, EduSubscription>();
  const repository: EduBillingRepository = {
    async withUserLock(_userId, work) {
      const draft = structuredClone(row);
      const result = await work({
        verification: draft,
        account,
        latestApprovalRevision,
        async save(patch) {
          if (failSave) throw new Error("mock persistence failure");
          Object.assign(draft, patch);
        },
      });
      row = draft;
      return result;
    },
    listUserIds: vi.fn(async () => [42]),
    async deliverNotice(n, send) {
      const state = noticeStates.get(n.key);
      if (state) return state === "sent" ? "sent" : "uncertain";
      noticeStates.set(n.key, "attempting");
      notices.push(n);
      if (await send(n)) {
        noticeStates.set(n.key, "sent");
        return "sent";
      }
      return "uncertain";
    },
  };
  const deps: EduBillingDependencies = {
    repository,
    now: () => now,
    sendEmail: vi.fn(async () => true),
    stripe: {
      mode: "test",
      resolvePlan: vi.fn(async (plan, interval) => ({
        priceId: `price_${plan}_${interval}`,
        productId: `prod_${plan}`,
        eligibleProductIds: ["prod_starter", "prod_professional"],
      })),
      createCoupon: vi.fn(async (p, key) => {
        const id = p.id ?? key;
        if (coupons.has(id)) return coupons.get(id)!;
        const c: EduCoupon = {
          id,
          livemode: false,
          percentOff: p.percent_off ?? null,
          duration: p.duration!,
          months: p.duration_in_months ?? null,
          redeemBy: p.redeem_by ?? null,
          products: p.applies_to?.products ?? [],
          metadata: p.metadata as Record<string, string>,
        };
        coupons.set(c.id, c);
        return c;
      }),
      retrieveCoupon: vi.fn(async id => coupons.get(id)!),
      createCheckout: vi.fn(async p => {
        const id = `cs_${checkouts.size + 1}`;
        const s: EduCheckout = {
          id,
          status: "open",
          url: `https://checkout.example.test/${id}`,
          livemode: false,
          expiresAt: Math.floor((now.getTime() + day) / 1000),
          customerId: p.customer as string,
          subscriptionId: null,
          paymentStatus: "unpaid",
          metadata: p.metadata as Record<string, string>,
        };
        checkouts.set(id, s);
        return s;
      }),
      retrieveCheckout: vi.fn(async id => checkouts.get(id)!),
      expireCheckout: vi.fn(async id => {
        checkouts.get(id)!.status = "expired";
      }),
      retrieveSubscription: vi.fn(async id => subscriptions.get(id)!),
      setDiscounts: vi.fn(async (id, discounts) => {
        const s = subscriptions.get(id)!;
        s.discounts = discounts.map(d =>
          "discount" in d
            ? s.discounts.find(old => old.id === d.discount)!
            : {
                id: `di_${d.coupon}`,
                coupon: coupons.get(d.coupon)!,
                end: Math.floor((now.getTime() + 365 * day) / 1000),
              }
        );
      }),
    },
  };
  const input = {
    userId: 42,
    customerId: "cus_test",
    plan: "professional",
    interval: "month" as const,
    successUrl: "https://www.ologywood.com/subscription/success",
    cancelUrl: "https://www.ologywood.com/pricing",
  };
  async function activate() {
    const checkout = await prepareEduDiscountCheckout(input, deps);
    if (checkout.status !== "ready")
      throw new Error("fixture checkout not ready");
    const s = checkouts.get(checkout.checkoutSessionId)!;
    Object.assign(s, {
      status: "complete",
      subscriptionId: "sub_test",
      paymentStatus: "paid",
    });
    const sub: EduSubscription = {
      id: "sub_test",
      livemode: false,
      customerId: "cus_test",
      status: "active",
      metadata: { ...s.metadata },
      productIds: ["prod_professional"],
      unsupportedDiscounts: false,
      discounts: [
        {
          id: "di_edu",
          coupon: coupons.get(checkout.couponId)!,
          end: Math.floor(date("2027-01-01T00:00:00Z").getTime() / 1000),
        },
      ],
    };
    subscriptions.set(sub.id, sub);
    account.stripeSubscriptionId = sub.id;
    await recordEduSubscriptionActivation(
      { userId: 42, checkoutSessionId: s.id, subscriptionId: sub.id },
      deps
    );
    return sub;
  }
  return {
    deps,
    input,
    notices,
    noticeStates,
    coupons,
    checkouts,
    subscriptions,
    account,
    activate,
    get row() {
      return row;
    },
    setNow(value: string) {
      now = date(value);
    },
    setApprovalRevision(value: number) {
      latestApprovalRevision = value;
    },
    failSave(value: boolean) {
      failSave = value;
    },
  };
}

describe("EDU billing lifecycle — mocked adapters only", () => {
  it("issues exactly 50% restricted 12-month coupons with bounded redemption and no trial/promotion stacking", async () => {
    const f = fixture();
    const result = await prepareEduDiscountCheckout(f.input, f.deps);
    expect(result.status).toBe("ready");
    expect(f.deps.stripe.createCoupon).toHaveBeenCalledWith(
      expect.objectContaining({
        percent_off: 50,
        duration: "repeating",
        duration_in_months: 12,
        max_redemptions: 1,
        applies_to: { products: ["prod_professional", "prod_starter"] },
        redeem_by: Math.floor(f.row.verifiedUntil!.getTime() / 1000),
      }),
      expect.any(String)
    );
    const p = vi.mocked(f.deps.stripe.createCheckout).mock.calls[0][0];
    expect(p.discounts).toHaveLength(1);
    expect(p.allow_promotion_codes).toBeUndefined();
    expect(p.subscription_data?.trial_period_days).toBeUndefined();
    expect(f.row.billingVerificationRevision).toBe(1);
    expect(f.row.billingMode).toBe("test");
    expect(f.deps.sendEmail).toHaveBeenCalledOnce();
  });
  it("excludes Enterprise and refuses EDU/referral stacking before issuing any coupon", async () => {
    const f = fixture();
    expect(
      await prepareEduDiscountCheckout(
        { ...f.input, plan: "enterprise" },
        f.deps
      )
    ).toEqual({ status: "not_applicable", reason: "unsupported_plan" });
    await expect(
      prepareEduDiscountCheckout({ ...f.input, useCredits: true }, f.deps)
    ).rejects.toMatchObject({ reason: "edu_cannot_stack_referral_credits" });
    expect(f.deps.stripe.createCoupon).not.toHaveBeenCalled();
  });
  it("reuses outstanding eligible checkout without creating coupons, notices or sessions", async () => {
    const f = fixture();
    const first = await prepareEduDiscountCheckout(f.input, f.deps);
    const second = await prepareEduDiscountCheckout(f.input, f.deps);
    expect(second).toMatchObject({ ...first, reused: true });
    expect(f.deps.stripe.createCheckout).toHaveBeenCalledOnce();
    expect(f.deps.stripe.createCoupon).toHaveBeenCalledOnce();
    expect(f.deps.sendEmail).toHaveBeenCalledOnce();
  });
  it("expires stale checkout when plan changes and retains anchored verification discount end", async () => {
    const f = fixture();
    const first = await prepareEduDiscountCheckout(f.input, f.deps);
    f.setNow("2026-07-01T00:00:00Z");
    const next = await prepareEduDiscountCheckout(
      { ...f.input, plan: "starter" },
      f.deps
    );
    expect(f.deps.stripe.expireCheckout).toHaveBeenCalledWith(
      first.status === "ready" ? first.checkoutSessionId : "invalid"
    );
    expect(next.status === "ready" && next.discountEndsAt).toEqual(
      f.row.verifiedUntil
    );
    expect(f.deps.sendEmail).toHaveBeenCalledOnce();
  });
  it("does not grant a fresh year to a late checkout or a checkout in too-short grace", async () => {
    const f = fixture();
    f.setNow("2026-12-15T00:00:00Z");
    await expect(
      prepareEduDiscountCheckout(f.input, f.deps)
    ).rejects.toMatchObject({
      reason: "renew_before_checkout_notice_window_too_short",
    });
    f.setNow("2027-01-10T00:00:00Z");
    await expect(
      prepareEduDiscountCheckout(f.input, f.deps)
    ).rejects.toMatchObject({
      reason: "renew_before_checkout_notice_window_too_short",
    });
    expect(f.deps.stripe.createCheckout).not.toHaveBeenCalled();
  });
  it("records only paid activation provenance; replay is idempotent and never fabricates trial access", async () => {
    const f = fixture();
    await f.activate();
    expect(f.row.stripeSubscriptionId).toBe("sub_test");
    expect(
      await recordEduSubscriptionActivation(
        {
          userId: 42,
          checkoutSessionId: f.row.checkoutSessionId!,
          subscriptionId: "sub_test",
        },
        f.deps
      )
    ).toMatchObject({ status: "recorded" });
    f.checkouts.get(f.row.checkoutSessionId!)!.paymentStatus = "unpaid";
    await expect(
      recordEduSubscriptionActivation(
        {
          userId: 42,
          checkoutSessionId: f.row.checkoutSessionId!,
          subscriptionId: "sub_test",
        },
        f.deps
      )
    ).rejects.toMatchObject({ reason: "activation_evidence_mismatch" });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("rejects competing subscription activation", async () => {
    const f = fixture();
    await f.activate();
    f.account.stripeSubscriptionId = "sub_other";
    await expect(
      recordEduSubscriptionActivation(
        {
          userId: 42,
          checkoutSessionId: f.row.checkoutSessionId!,
          subscriptionId: "sub_test",
        },
        f.deps
      )
    ).rejects.toMatchObject({ reason: "competing_subscription_identity" });
  });
  it("expires revoked pending checkout without touching any paid subscription", async () => {
    const f = fixture();
    await prepareEduDiscountCheckout(f.input, f.deps);
    f.row.status = "revoked";
    f.row.revision = 2;
    const result = await reconcileEduBillingLifecycle({ userId: 42 }, f.deps);
    expect(result).toMatchObject({
      status: "skipped",
      reason: "checkout_only",
    });
    expect(f.deps.stripe.expireCheckout).toHaveBeenCalledOnce();
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("expires an outstanding checkout after eligibility/grace expiry", async () => {
    const f = fixture();
    await prepareEduDiscountCheckout(f.input, f.deps);
    f.setNow("2027-02-01T00:00:00Z");
    await reconcileEduBillingLifecycle({ userId: 42 }, f.deps);
    expect(f.deps.stripe.expireCheckout).toHaveBeenCalledOnce();
  });
  it("removes only the matched EDU discount at anchored expiry while preserving unrelated discounts and paid plan", async () => {
    const f = fixture();
    const sub = await f.activate();
    sub.discounts.push({
      id: "di_unrelated",
      coupon: {
        ...sub.discounts[0].coupon!,
        id: "coupon_other",
        metadata: { type: "referral_credit" },
      },
      end: null,
    });
    f.setNow("2027-01-01T00:00:00Z");
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "discount_removed" });
    expect(f.deps.stripe.setDiscounts).toHaveBeenCalledWith(
      "sub_test",
      [{ discount: "di_unrelated" }],
      expect.any(String)
    );
    expect(sub.status).toBe("active");
    expect(f.row.stripeSubscriptionId).toBe("sub_test");
  });
  it("requires 30 days of documented notice when notices are absent, without immediate discount mutation", async () => {
    const f = fixture();
    const sub = await f.activate();
    sub.discounts[0].end! += (60 * day) / 1000;
    f.row.expiryNoticeSentAt = null;
    f.setNow("2026-12-15T00:00:00Z");
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "notice_sent" });
    f.setNow("2027-01-01T00:00:00Z");
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "notice_period" });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
    f.setNow("2027-01-14T00:00:00Z");
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "discount_removed" });
  });
  it("failed notice leaves discount unchanged and does not automatically resend uncertain SendGrid attempts", async () => {
    const f = fixture();
    const sub = await f.activate();
    sub.discounts[0].end! += (60 * day) / 1000;
    f.row.expiryNoticeSentAt = null;
    f.setNow("2026-12-15T00:00:00Z");
    vi.mocked(f.deps.sendEmail).mockResolvedValue(false);
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toMatchObject({
      reason: "transactional_notice_delivery_uncertain",
    });
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toMatchObject({
      reason: "transactional_notice_delivery_uncertain",
    });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
    expect(f.row.expiryNoticeSentAt).toBeNull();
    expect(f.deps.sendEmail).toHaveBeenCalledTimes(2); // activation terms + one uncertain renewal reminder
  });
  it("notice acceptance survives billing rollback and a successful retry does not send it twice", async () => {
    const f = fixture();
    f.failSave(true);
    await expect(prepareEduDiscountCheckout(f.input, f.deps)).rejects.toThrow(
      "mock persistence failure"
    );
    f.failSave(false);
    await prepareEduDiscountCheckout(f.input, f.deps);
    expect(f.deps.sendEmail).toHaveBeenCalledOnce();
  });
  it("applies a renewed coupon only after committed manual-proof approval evidence and refuses stacking", async () => {
    const f = fixture();
    const sub = await f.activate();
    f.setNow("2027-01-01T00:00:00Z");
    f.row.revision = 3;
    f.row.verifiedUntil = date("2028-01-01T00:00:00Z");
    f.row.graceUntil = date("2028-01-31T00:00:00Z");
    f.setApprovalRevision(3);
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "renewed" });
    expect(f.row.billingVerificationRevision).toBe(3);
    expect(f.row.discountEndsAt).toEqual(f.row.verifiedUntil);
    expect(sub.metadata.eduVerificationRevision).toBe("1");
    f.setNow("2027-01-02T00:00:00Z");
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "unchanged" });
  });
  it("resubmission revision alone never renews charged discounts", async () => {
    const f = fixture();
    await f.activate();
    f.row.revision = 2;
    f.setNow("2026-07-01T00:00:00Z");
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "unchanged" });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("reapproved verification expires stale pending checkout and issues revision-specific provenance", async () => {
    const f = fixture();
    await prepareEduDiscountCheckout(f.input, f.deps);
    f.row.status = "revoked";
    f.row.revision = 2;
    await reconcileEduBillingLifecycle({ userId: 42 }, f.deps);
    f.row.status = "approved";
    f.row.revision = 3;
    f.setApprovalRevision(3);
    const result = await prepareEduDiscountCheckout(f.input, f.deps);
    expect(result.status).toBe("ready");
    expect(f.row.billingVerificationRevision).toBe(3);
    expect(f.coupons.size).toBe(2);
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("refuses renewal with unrelated discounts instead of replacing or stacking them", async () => {
    const f = fixture();
    const sub = await f.activate();
    sub.discounts.push({ id: "di_other", coupon: null, end: null });
    f.row.revision = 2;
    f.setApprovalRevision(2);
    f.setNow("2027-01-01T00:00:00Z");
    f.row.verifiedUntil = date("2028-01-01T00:00:00Z");
    f.row.graceUntil = date("2028-01-31T00:00:00Z");
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toMatchObject({
      reason: "renewal_cannot_stack_unrelated_discounts",
    });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("isolates test mode from stored live billing before any Stripe lookup", async () => {
    const f = fixture();
    f.row.billingMode = "live";
    f.row.stripeSubscriptionId = "sub_live";
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toMatchObject({ reason: "billing_mode_mismatch" });
    expect(f.deps.stripe.retrieveSubscription).not.toHaveBeenCalled();
  });
  it("isolates test activation from a live subscription object returned by an adapter", async () => {
    const f = fixture();
    const sub = await f.activate();
    sub.livemode = true;
    await expect(
      recordEduSubscriptionActivation(
        {
          userId: 42,
          checkoutSessionId: f.row.checkoutSessionId!,
          subscriptionId: sub.id,
        },
        f.deps
      )
    ).rejects.toMatchObject({ reason: "billing_mode_mismatch" });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("fails closed on legacy billing and reports blockers rather than fake batch success", async () => {
    const f = fixture();
    f.row.stripeCouponId = "legacy_coupon";
    const result = await runEduLifecycleBatch({}, f.deps);
    expect(result.blocked).toBe(1);
    expect(result.results[0]).toMatchObject({
      status: "blocked",
      reason: "legacy_billing_provenance_requires_review",
    });
  });
  it("reports unsupported Stripe discount shapes without removing anything", async () => {
    const f = fixture();
    const sub = await f.activate();
    sub.unsupportedDiscounts = true;
    f.setNow("2027-01-01T00:00:00Z");
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toMatchObject({
      reason: "unexpanded_or_item_level_discounts_require_review",
    });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("recovers completed checkout activation after subscription sync without a nested row lock", async () => {
    const f = fixture();
    await f.activate();
    f.row.stripeSubscriptionId = null;
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "unchanged" });
    expect(f.row.stripeSubscriptionId).toBe("sub_test");
  });
  it("blocks completed checkout recovery before parent subscription sync", async () => {
    const f = fixture();
    await f.activate();
    f.row.stripeSubscriptionId = null;
    f.account.stripeSubscriptionId = null;
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toMatchObject({
      reason: "completed_checkout_requires_subscription_sync",
    });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("recovers a matched renewal coupon after a Stripe success and local billing rollback", async () => {
    const f = fixture();
    await f.activate();
    f.setNow("2027-01-01T00:00:00Z");
    f.row.revision = 2;
    f.setApprovalRevision(2);
    f.row.verifiedUntil = date("2028-01-01T00:00:00Z");
    f.row.graceUntil = date("2028-01-31T00:00:00Z");
    f.failSave(true);
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toThrow("mock persistence failure");
    f.failSave(false);
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "renewed" });
    expect(f.row.billingVerificationRevision).toBe(2);
    expect(f.deps.stripe.setDiscounts).toHaveBeenCalledOnce();
  });
  it("renews a supported subscription after its previously matched EDU discount was removed", async () => {
    const f = fixture();
    const sub = await f.activate();
    sub.discounts = [];
    f.setNow("2027-01-01T00:00:00Z");
    f.row.revision = 2;
    f.setApprovalRevision(2);
    f.row.verifiedUntil = date("2028-01-01T00:00:00Z");
    f.row.graceUntil = date("2028-01-31T00:00:00Z");
    expect(
      await reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).toMatchObject({ status: "renewed" });
    expect(f.deps.stripe.setDiscounts).toHaveBeenCalledOnce();
  });
  it("explicitly blocks provider-controlled coupon expiry that cannot respect a missing 30-day notice", async () => {
    const f = fixture();
    await f.activate();
    f.row.expiryNoticeSentAt = null;
    f.setNow("2026-12-15T00:00:00Z");
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toMatchObject({
      reason: "stripe_coupon_expiry_precedes_notice_window_manual_review",
    });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
  it("reports coupons naturally expiring earlier than the recorded disclosure", async () => {
    const f = fixture();
    const sub = await f.activate();
    sub.discounts[0].end! -= day / 1000;
    await expect(
      reconcileEduBillingLifecycle({ userId: 42 }, f.deps)
    ).rejects.toMatchObject({
      reason: "stripe_discount_ends_before_disclosed_deadline",
    });
    expect(f.deps.stripe.setDiscounts).not.toHaveBeenCalled();
  });
});

describe("EDU runtime adapter contracts — fake SQL and Stripe clients", () => {
  it("SQL notice outbox preserves accepted idempotency and uncertain sends without a real database", async () => {
    const states = new Map<string, string>();
    const execute = vi.fn(async (sql: string, values?: unknown[]) => {
      if (sql.startsWith("CREATE TABLE")) return [{}];
      if (sql.startsWith("INSERT IGNORE")) {
        const key = String(values![0]);
        const exists = states.has(key);
        if (!exists) states.set(key, "attempting");
        return [{ affectedRows: exists ? 0 : 1 }];
      }
      if (sql.startsWith("SELECT state"))
        return [[{ state: states.get(String(values![0])) }]];
      if (sql.startsWith("UPDATE edu_billing_notices")) {
        states.set(String(values![1]), String(values![0]));
        return [{ affectedRows: 1 }];
      }
      throw new Error("unexpected mocked SQL");
    });
    const repository = await createSqlEduBillingRepository({
      execute,
      getConnection: vi.fn(),
    });
    const n: EduNotice = {
      key: "edu-notice",
      userId: 42,
      verificationId: 7,
      revision: 1,
      kind: "expiry",
      to: "student@example.test",
      subject: "Deadline",
      html: "Deadline",
      deadline: date("2027-01-01T00:00:00Z"),
    };
    const send = vi.fn(async () => true);
    expect(await repository.deliverNotice(n, send)).toBe("sent");
    expect(await repository.deliverNotice(n, send)).toBe("sent");
    expect(send).toHaveBeenCalledOnce();
    const failed = vi.fn(async () => false);
    expect(
      await repository.deliverNotice({ ...n, key: "uncertain" }, failed)
    ).toBe("uncertain");
    expect(
      await repository.deliverNotice({ ...n, key: "uncertain" }, failed)
    ).toBe("uncertain");
    expect(failed).toHaveBeenCalledOnce();
  });
  it("schema bootstrap is additive and has no billing or scheduling mutations", async () => {
    const execute = vi.fn(async () => []);
    await ensureEduBillingSchema({ execute });
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS");
  });
  it("real Stripe gateway contract only replaces discounts with no proration or cancellation", async () => {
    const update = vi.fn(async () => ({}));
    const gateway = createEduStripeGateway(
      { subscriptions: { update } } as unknown as Stripe,
      "test"
    );
    await gateway.setDiscounts("sub_test", [{ discount: "di_keep" }], "key");
    expect(update).toHaveBeenCalledWith(
      "sub_test",
      { discounts: [{ discount: "di_keep" }], proration_behavior: "none" },
      { idempotencyKey: "key" }
    );
    await gateway.setDiscounts("sub_test", [], "empty-key");
    expect(update).toHaveBeenLastCalledWith(
      "sub_test",
      { discounts: "", proration_behavior: "none" },
      { idempotencyKey: "empty-key" }
    );
  });
});

describe("EDU audited recovery and product isolation", () => {
  it("requires verified authorization before touching uncertain delivery records", async () => {
    const execute = vi.fn();
    await expect(
      resolveEduNoticeDelivery(
        {
          noticeKey: "edu:7:1:expiry:notice",
          actorUserId: 9,
          decision: "not_accepted",
          providerEvidence: "Provider message search confirms rejection",
        },
        {
          pool: { execute, getConnection: vi.fn() },
          authorize: async () => false,
        }
      )
    ).rejects.toMatchObject({ reason: "notice_resolution_forbidden" });
    expect(execute).not.toHaveBeenCalled();
  });
  it("transactionally audits provider-confirmed nonacceptance before allowing a future retry", async () => {
    const execute = vi.fn(async (sql: string) =>
      sql.startsWith("SELECT")
        ? [[{ state: "attempting", createdAt: date("2026-01-01T00:00:00Z") }]]
        : [{ affectedRows: 1 }]
    );
    const conn = {
      execute,
      beginTransaction: vi.fn(async () => {}),
      commit: vi.fn(async () => {}),
      rollback: vi.fn(async () => {}),
      release: vi.fn(),
    };
    const result = await resolveEduNoticeDelivery(
      {
        noticeKey: "edu:7:1:expiry:notice",
        actorUserId: 9,
        decision: "not_accepted",
        providerEvidence: "Provider message search confirms rejection",
      },
      {
        pool: { execute, getConnection: async () => conn },
        authorize: async () => true,
        now: () => date("2026-01-02T00:00:00Z"),
      }
    );
    expect(result.status).toBe("retry_authorized");
    expect(conn.commit).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO edu_billing_notice_resolutions"),
      [
        "edu:7:1:expiry:notice",
        9,
        "not_accepted",
        "Provider message search confirms rejection",
      ]
    );
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE edu_billing_notices"),
      ["retry_authorized", null, "edu:7:1:expiry:notice", "attempting"]
    );
  });
  it("never resolves a still-running attempt or invents acceptance time", async () => {
    const execute = vi.fn(async () => [
      [{ state: "attempting", createdAt: date("2026-01-01T00:00:00Z") }],
    ]);
    const conn = {
      execute,
      beginTransaction: vi.fn(async () => {}),
      commit: vi.fn(async () => {}),
      rollback: vi.fn(async () => {}),
      release: vi.fn(),
    };
    await expect(
      resolveEduNoticeDelivery(
        {
          noticeKey: "edu:7:1:expiry:notice",
          actorUserId: 9,
          decision: "accepted",
          providerEvidence: "Provider acceptance log",
        },
        {
          pool: { execute, getConnection: async () => conn },
          authorize: async () => true,
          now: () => date("2026-01-01T00:00:30Z"),
        }
      )
    ).rejects.toMatchObject({ reason: "invalid_provider_acceptance_time" });
    await expect(
      resolveEduNoticeDelivery(
        {
          noticeKey: "edu:7:1:expiry:notice",
          actorUserId: 9,
          decision: "not_accepted",
          providerEvidence: "Provider definitive rejection log",
        },
        {
          pool: { execute, getConnection: async () => conn },
          authorize: async () => true,
          now: () => date("2026-01-01T00:00:30Z"),
        }
      )
    ).rejects.toMatchObject({ reason: "notice_attempt_still_in_flight" });
    expect(conn.rollback).toHaveBeenCalledOnce();
  });
  it("resolves actual allowed plan products and refuses a product shared with Enterprise", async () => {
    const price = (key: string, product: string, amount: number) => ({
      id: `price_${key}`,
      lookup_key: key,
      product,
      livemode: false,
      type: "recurring",
      currency: "usd",
      unit_amount: amount,
      recurring: { interval: "month", interval_count: 1 },
    });
    const prices = [
      price("artist_starter_monthly", "prod_starter", 900),
      price("artist_professional_monthly", "prod_pro", 2900),
      price("artist_enterprise_monthly", "prod_enterprise", 7900),
    ];
    const list = vi.fn(async () => ({ data: prices, has_more: false }));
    const gateway = createEduStripeGateway(
      { prices: { list } } as unknown as Stripe,
      "test"
    );
    expect(await gateway.resolvePlan("starter", "month")).toEqual({
      priceId: "price_artist_starter_monthly",
      productId: "prod_starter",
      eligibleProductIds: ["prod_starter", "prod_pro"],
    });
    prices[2].product = "prod_pro";
    await expect(
      gateway.resolvePlan("professional", "month")
    ).rejects.toMatchObject({
      reason: "configured_plan_price_unavailable_or_ambiguous",
    });
  });
});
